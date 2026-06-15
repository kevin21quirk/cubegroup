'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
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
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []
  const companyFilter = isStaff && assignedIds.length > 0 ? { companyId: { in: assignedIds } } : {}

  return await prisma.payrollSubmission.findMany({
    where: companyFilter,
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

export async function generateInvoiceForSubmission(submissionId: string): Promise<{ invoiceId: string }> {
  const submission = await prisma.payrollSubmission.findUnique({
    where: { id: submissionId },
    include: {
      company: true,
      payrollEntries: true,
    },
  })
  if (!submission) throw new Error('Submission not found')

  // Check if an invoice already exists for this submission
  const existing = await prisma.invoice.findFirst({
    where: { payrollSubmissionId: submissionId, invoiceType: 'CLIENT_INVOICE' },
    select: { id: true, paymentStatus: true },
  })
  // If already PAID, never touch it – just return it
  if (existing?.paymentStatus === 'PAID') return { invoiceId: existing.id }

  // ── Build line items + totals from current (just-saved) entry data ──────
  const totalGross    = submission.payrollEntries.reduce((sum, e) => sum + (e.grossPay || e.totalGrossPay || 0), 0)
  const totalFees     = submission.payrollEntries.reduce((sum, e) => sum + (e.feeAmount    || 0), 0)
  const totalExpenses = submission.payrollEntries.reduce((sum, e) => sum + (e.expenseAmount || 0), 0)
  const subtotal = parseFloat((totalGross + totalFees + totalExpenses).toFixed(2))

  const invoiceNumber = existing
    ? (await prisma.invoice.findUnique({ where: { id: existing.id }, select: { invoiceNumber: true } }))!.invoiceNumber
    : `INV-${new Date().getFullYear()}-${submission.id.slice(-8).toUpperCase()}`
  const paymentDays = submission.company.paymentTerms ?? 30

  const lineItems = submission.payrollEntries.map(e => {
    const gross = parseFloat((e.grossPay || e.totalGrossPay || 0).toFixed(2))
    const items: { description: string; quantity: number; unitPrice: number; amount: number; vatRate: number }[] = [{
      description: `Payroll – ${[e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName} (${submission.payrollWeek})`,
      quantity: 1,
      unitPrice: gross,
      amount: gross,
      vatRate: 0,
    }]
    if ((e.expenseAmount ?? 0) > 0) {
      const exp = parseFloat((e.expenseAmount ?? 0).toFixed(2))
      items.push({
        description: `Expenses – ${[e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName}${e.expenseNotes ? ` (${e.expenseNotes})` : ''}`,
        quantity: 1,
        unitPrice: exp,
        amount: exp,
        vatRate: 0,
      })
    }
    return items
  }).flat()

  if (totalFees > 0) {
    const feeUnit = parseFloat(totalFees.toFixed(2))
    lineItems.push({
      description: `Management fee (${submission.payrollWeek})`,
      quantity: 1,
      unitPrice: feeUnit,
      amount: feeUnit,
      vatRate: 0,
    })
  }

  let invoiceId: string

  if (existing) {
    // Rebuild: wipe old line items then update totals
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: existing.id } })
    await prisma.invoice.update({
      where: { id: existing.id },
      data: {
        subtotal,
        vatAmount:   0,
        totalAmount: subtotal,
        items:       { create: lineItems },
      },
    })
    invoiceId = existing.id
  } else {
    const invoice = await prisma.invoice.create({
      data: {
        companyId:           submission.companyId,
        payrollSubmissionId: submissionId,
        invoiceNumber,
        invoiceType:         'CLIENT_INVOICE',
        billingName:         submission.company.name,
        billingAddress:      submission.company.billingAddress  ?? undefined,
        billingCity:         submission.company.billingCity     ?? undefined,
        billingPostcode:     submission.company.billingPostcode ?? undefined,
        subtotal,
        vatAmount:           0,
        totalAmount:         subtotal,
        paymentStatus:       'UNPAID',
        issueDate:           new Date(),
        dueDate:             new Date(Date.now() + paymentDays * 86_400_000),
        items:               { create: lineItems },
      },
    })
    invoiceId = invoice.id
  }

  revalidatePath(`/dashboard/payroll/${submissionId}`)
  revalidatePath('/dashboard/invoices')
  return { invoiceId }
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

function calcEntry(gross: number, taxRate: number, feeAmount: number, umbrellaSharePct: number, brokerSharePct: number, expenseAmount = 0) {
  const taxAmount           = parseFloat(((gross * taxRate) / 100).toFixed(2))
  const umbrellaShareAmount = parseFloat(((feeAmount * umbrellaSharePct) / 100).toFixed(2))
  const brokerShareAmount   = parseFloat(((feeAmount * brokerSharePct)   / 100).toFixed(2))
  const netToWorker         = parseFloat((gross - taxAmount - feeAmount + expenseAmount).toFixed(2))
  const feeRate             = gross > 0 ? parseFloat(((feeAmount / gross) * 100).toFixed(4)) : 0
  return { taxAmount, feeAmount, feeRate, umbrellaShareAmount, brokerShareAmount, netToWorker }
}

export async function updateEntryTaxRate(entryId: string, taxRate: number) {
  const entry = await prisma.payrollEntry.findUnique({ where: { id: entryId } })
  if (!entry) throw new Error('Entry not found')
  const gross = entry.grossPay || entry.totalGrossPay
  const calc  = calcEntry(gross, taxRate, entry.feeAmount, entry.umbrellaSharePct, entry.brokerSharePct, entry.expenseAmount ?? 0)
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
    const calc  = calcEntry(gross, taxRate, feeAmount, umbrellaSharePct, brokerSharePct, expenseAmount ?? 0)
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
    const feeAmount = e.feeAmount ?? 0
    const expenseAmount = e.expenseAmount ?? 0
    const taxAmount = e.taxAmount || parseFloat(((gross * taxRate) / 100).toFixed(2))
    const netToWorker = e.netToWorker || parseFloat((gross - taxAmount - feeAmount + expenseAmount).toFixed(2))

    const co = submission.company
    const coAddrParts = [co.billingAddress, co.billingCity, co.billingPostcode].filter(Boolean)

    const entry = {
      id: e.id,
      workerName: e.workerName,
      firstName: e.firstName,
      lastName: e.lastName,
      payrollWeek: e.payrollWeek,
      payDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      grossPay: gross,
      taxRate,
      taxAmount,
      feeAmount,
      expenseAmount,
      netToWorker,
      hoursWorked: e.hoursWorked,
      hourlyRate: e.hourlyRate,
      companyName: co.name,
      companyAddress: coAddrParts.join('  ') || null,
      companyRef: co.agencyRef ?? null,
      companyUTR: co.uniqueTaxRef ?? null,
      workerAddress1: e.worker?.addressLine1 ?? null,
      workerAddress2: e.worker?.addressLine2 ?? null,
      workerTown: e.worker?.town ?? null,
      workerPostCode: e.worker?.postCode ?? null,
      workerNI: e.worker?.nationalInsurance ?? null,
      workerUTR: e.worker?.utrNumber ?? null,
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

  // Only advance to SAVED_TO_SERVER — never regress a state that's already further along
  // (e.g. don't downgrade INVOICE_SENT or PAYMENT_RECEIVED if payslips are resent)
  const lateStates = ['READY_FOR_INVOICE', 'INVOICE_SENT', 'AWAITING_PAYMENT',
                      'PAYMENT_RECEIVED', 'UMBRELLA_INVOICE_SENT', 'COMPLETED']
  if (!lateStates.includes(submission.workflowState)) {
    await prisma.payrollSubmission.update({
      where: { id: submissionId },
      data: { workflowState: 'SAVED_TO_SERVER' },
    })
  }

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

export async function sendPayslipForEntry(entryId: string): Promise<{ status: 'sent' | 'no_email' | 'error'; error?: string; email?: string }> {
  try {
    const e = await prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: { worker: true, payrollSubmission: { include: { company: true } } },
    })
    if (!e) return { status: 'error', error: 'Entry not found' }

    const workerEmail = await resolveWorkerEmail(e, e.payrollSubmission.companyId)
    if (!workerEmail) return { status: 'no_email', error: `No email on file for ${e.firstName} ${e.lastName} – add one on the worker's Edit page` }

    const gross = e.grossPay || e.totalGrossPay
    const taxRate = e.taxRate ?? 20
    const feeAmount = e.feeAmount ?? 0
    const expenseAmount = e.expenseAmount ?? 0
    const taxAmount = e.taxAmount || parseFloat(((gross * taxRate) / 100).toFixed(2))
    const netToWorker = e.netToWorker || parseFloat((gross - taxAmount - feeAmount + expenseAmount).toFixed(2))

    const co = e.payrollSubmission.company
    const coAddrParts = [co.billingAddress, co.billingCity, co.billingPostcode].filter(Boolean)
    const worker = e.worker

    const svc = getPayslipService()
    await svc.sendPayslip({
      id: e.id,
      workerName: e.workerName,
      firstName: e.firstName,
      lastName: e.lastName,
      payrollWeek: e.payrollWeek,
      payDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      grossPay: gross,
      taxRate,
      taxAmount,
      feeAmount,
      expenseAmount,
      netToWorker,
      hoursWorked: e.hoursWorked,
      hourlyRate: e.hourlyRate,
      companyName: co.name,
      companyAddress: coAddrParts.join('  ') || null,
      companyRef: co.agencyRef ?? null,
      companyUTR: co.uniqueTaxRef ?? null,
      workerAddress1: worker?.addressLine1 ?? null,
      workerAddress2: worker?.addressLine2 ?? null,
      workerTown: worker?.town ?? null,
      workerPostCode: worker?.postCode ?? null,
      workerNI: worker?.nationalInsurance ?? null,
      workerUTR: worker?.utrNumber ?? null,
      workerEmail,
    })

    await prisma.payrollEntry.update({
      where: { id: entryId },
      data: { payslipStatus: 'SENT', payslipSentAt: new Date() },
    })

    revalidatePath(`/dashboard/payroll/${e.payrollSubmissionId}`)
    return { status: 'sent', email: workerEmail }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[sendPayslipForEntry]', msg)
    return { status: 'error', error: msg }
  }
}
