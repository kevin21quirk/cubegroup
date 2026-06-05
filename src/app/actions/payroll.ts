'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayslipService } from '@/services/payroll/PayslipService'

export async function createPayrollSubmission(formData: FormData) {
  const companyId = formData.get('companyId') as string
  const payrollWeek = formData.get('payrollWeek') as string
  const totalGrossPay = parseFloat(formData.get('totalGrossPay') as string)
  const totalEmployerNI = parseFloat(formData.get('totalEmployerNI') as string || '0')
  const totalPension = parseFloat(formData.get('totalPension') as string || '0')

  if (!companyId || !payrollWeek || !totalGrossPay) {
    throw new Error('Company, payroll week, and total gross pay are required')
  }

  const submission = await prisma.payrollSubmission.create({
    data: {
      companyId,
      payrollWeek,
      totalGrossPay,
      totalCubeFees: totalEmployerNI,
      totalUmbrellaFees: totalPension,
      workflowState: 'EMAIL_RECEIVED',
    },
  })

  revalidatePath('/dashboard/payroll')
  redirect(`/dashboard/payroll/${submission.id}`)
}

export async function getPayrollSubmissions() {
  return await prisma.payrollSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
      _count: {
        select: {
          payrollEntries: true,
        },
      },
    },
  })
}

export async function deletePayrollSubmission(id: string) {
  await prisma.payrollSubmission.delete({ where: { id } })
  revalidatePath('/dashboard/payroll')
}

export async function getPayrollSubmission(id: string) {
  const submission = await prisma.payrollSubmission.findUnique({
    where: { id },
    include: {
      company: true,
      payrollEntries: {
        include: { worker: true },
        orderBy: { createdAt: 'asc' },
      },
      invoices: true,
    },
  })
  if (!submission) return null

  // For entries imported from CSV (workerId = null), match to a worker by first+last name
  const unlinked = submission.payrollEntries.filter(e => !e.worker)
  if (unlinked.length > 0) {
    const companyWorkers = await prisma.worker.findMany({
      where: { companyId: submission.companyId },
      select: { id: true, firstName: true, lastName: true, email: true },
    })

    const patched = submission.payrollEntries.map(entry => {
      if (entry.worker) return entry
      const match = companyWorkers.find(w =>
        (w.firstName ?? '').toLowerCase() === (entry.firstName ?? '').toLowerCase() &&
        (w.lastName  ?? '').toLowerCase() === (entry.lastName  ?? '').toLowerCase()
      )
      return match ? { ...entry, workerId: match.id, worker: match as any } : entry
    })

    // Persist matched workerIds in background so future loads are faster
    const toLink = patched.filter(e => e.worker && !submission.payrollEntries.find(orig => orig.id === e.id)?.worker)
    if (toLink.length > 0) {
      prisma.$transaction(toLink.map(e =>
        prisma.payrollEntry.update({ where: { id: e.id }, data: { workerId: e.workerId } })
      )).catch(() => {})
    }

    return { ...submission, payrollEntries: patched }
  }

  return submission
}

function calcEntry(gross: number, taxRate: number, feeAmount: number, umbrellaSharePct: number, brokerSharePct: number) {
  const taxAmount           = parseFloat(((gross * taxRate) / 100).toFixed(2))
  const umbrellaShareAmount = parseFloat(((feeAmount * umbrellaSharePct) / 100).toFixed(2))
  const brokerShareAmount   = parseFloat(((feeAmount * brokerSharePct)   / 100).toFixed(2))
  const netToWorker         = parseFloat((gross - taxAmount - feeAmount).toFixed(2))
  const feeRate             = gross > 0 ? parseFloat(((feeAmount / gross) * 100).toFixed(4)) : 0
  return { taxAmount, feeAmount, feeRate, umbrellaShareAmount, brokerShareAmount, netToWorker }
}

export async function updateEntryTaxRate(entryId: string, taxRate: number) {
  const entry = await prisma.payrollEntry.findUnique({ where: { id: entryId } })
  if (!entry) throw new Error('Entry not found')
  const gross = entry.grossPay || entry.totalGrossPay
  const calc  = calcEntry(gross, taxRate, entry.feeAmount, entry.umbrellaSharePct, entry.brokerSharePct)
  await prisma.payrollEntry.update({ where: { id: entryId }, data: { taxRate, ...calc, payslipStatus: 'PENDING' } })
  revalidatePath(`/dashboard/payroll/${entry.payrollSubmissionId}`)
}

export async function saveBulkEntryRates(updates: {
  id: string
  taxRate: number
  feeAmount: number
  expenseAmount?: number
  expenseNotes?: string
  umbrellaSharePct: number
  brokerSharePct: number
}[]) {
  for (const { id, taxRate, feeAmount, umbrellaSharePct, brokerSharePct, expenseAmount, expenseNotes } of updates) {
    const entry = await prisma.payrollEntry.findUnique({ where: { id } })
    if (!entry) continue
    const gross = entry.grossPay || entry.totalGrossPay
    const calc  = calcEntry(gross, taxRate, feeAmount, umbrellaSharePct, brokerSharePct)
    await prisma.payrollEntry.update({
      where: { id },
      data: { umbrellaSharePct, brokerSharePct, ...calc, payslipStatus: 'PENDING', expenseAmount: expenseAmount ?? 0, expenseNotes: expenseNotes ?? null },
    })
    revalidatePath(`/dashboard/payroll/${entry.payrollSubmissionId}`)
  }
}

export async function saveBulkTaxRates(updates: { id: string; taxRate: number }[]) {
  for (const { id, taxRate } of updates) {
    await updateEntryTaxRate(id, taxRate)
  }
}

export async function approveAllEntries(submissionId: string) {
  await prisma.payrollEntry.updateMany({
    where: { payrollSubmissionId: submissionId, payslipStatus: 'PENDING' },
    data: { payslipStatus: 'APPROVED' },
  })
  revalidatePath(`/dashboard/payroll/${submissionId}`)
}

export async function sendPayslipsForSubmission(submissionId: string) {
  const submission = await prisma.payrollSubmission.findUnique({
    where: { id: submissionId },
    include: {
      company: true,
      payrollEntries: {
        where: { payslipStatus: { in: ['APPROVED', 'PENDING'] } },
        include: { worker: true },
      },
    },
  })
  if (!submission) throw new Error('Submission not found')

  const svc = getPayslipService()
  const results: { name: string; status: 'sent' | 'no_email' | 'error'; error?: string }[] = []

  for (const e of submission.payrollEntries) {
    const workerEmail = await resolveWorkerEmail(e, submission.companyId)
    const gross = e.grossPay || e.totalGrossPay
    const taxRate = e.taxRate ?? 20
    const taxAmount = e.taxAmount || parseFloat(((gross * taxRate) / 100).toFixed(2))
    const netToWorker = e.netToWorker || parseFloat((gross - taxAmount).toFixed(2))

    const feeAmount = e.feeAmount ?? 0

    const entry = {
      id: e.id,
      workerName: e.workerName,
      firstName: e.firstName,
      lastName: e.lastName,
      payrollWeek: e.payrollWeek,
      grossPay: gross,
      taxRate,
      taxAmount,
      feeAmount,
      netToWorker,
      hoursWorked: e.hoursWorked,
      hourlyRate: e.hourlyRate,
      companyName: submission.company.name,
      workerEmail,
    }

    const name = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
    if (!workerEmail) {
      results.push({ name, status: 'no_email' })
      continue
    }
    try {
      await svc.sendPayslip(entry)
      results.push({ name, status: 'sent' })
    } catch (err: any) {
      results.push({ name, status: 'error', error: err?.message ?? String(err) })
    }
  }

  await prisma.payrollSubmission.update({
    where: { id: submissionId },
    data: { workflowState: 'COMPLETED' },
  })

  revalidatePath(`/dashboard/payroll/${submissionId}`)
  return results
}

async function resolveWorkerEmail(entry: { workerId: string | null; worker: { email: string | null } | null; firstName: string | null; lastName: string | null }, companyId: string): Promise<string | null> {
  if (entry.worker?.email) return entry.worker.email
  // Fallback: match by name within the company (CSV imports have no workerId)
  const match = await prisma.worker.findFirst({
    where: {
      companyId,
      firstName: { equals: entry.firstName ?? '', mode: 'insensitive' },
      lastName:  { equals: entry.lastName  ?? '', mode: 'insensitive' },
    },
    select: { id: true, email: true },
  })
  if (match) {
    // Persist the link so future direct fetches work
    await prisma.payrollEntry.update({ where: { id: (entry as any).id }, data: { workerId: match.id } }).catch(() => {})
    return match.email
  }
  return null
}

export async function sendPayslipForEntry(entryId: string) {
  const e = await prisma.payrollEntry.findUnique({
    where: { id: entryId },
    include: { worker: true, payrollSubmission: { include: { company: true } } },
  })
  if (!e) throw new Error('Entry not found')

  const workerEmail = await resolveWorkerEmail(e, e.payrollSubmission.companyId)
  if (!workerEmail) return { status: 'no_email' as const }

  const gross = e.grossPay || e.totalGrossPay
  const taxRate = e.taxRate ?? 20
  const taxAmount = e.taxAmount || parseFloat(((gross * taxRate) / 100).toFixed(2))
  const netToWorker = e.netToWorker || parseFloat((gross - taxAmount).toFixed(2))

  const svc = getPayslipService()
  await svc.sendPayslip({
    id: e.id,
    workerName: e.workerName,
    firstName: e.firstName,
    lastName: e.lastName,
    payrollWeek: e.payrollWeek,
    grossPay: gross,
    taxRate,
    taxAmount,
    feeAmount: e.feeAmount ?? 0,
    netToWorker,
    hoursWorked: e.hoursWorked,
    hourlyRate: e.hourlyRate,
    companyName: e.payrollSubmission.company.name,
    workerEmail,
  })

  await prisma.payrollEntry.update({
    where: { id: entryId },
    data: { payslipStatus: 'SENT', payslipSentAt: new Date() },
  })

  revalidatePath(`/dashboard/payroll/${e.payrollSubmissionId}`)
  return { status: 'sent' as const }
}
