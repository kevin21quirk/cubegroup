import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const company = await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!company) return NextResponse.json({ error: 'No company found — create one first' }, { status: 400 })

    const workers = await prisma.worker.findMany({
      where: { companyId: company.id },
      take: 4,
    })

    const submission = await prisma.payrollSubmission.create({
      data: {
        companyId: company.id,
        payrollWeek: 'Week ending 06 Jun 2025',
        totalGrossPay: 0,
        workflowState: 'AWAITING_REVIEW',
      },
    })

    const dummyWorkers = [
      { firstName: 'James', lastName: 'Mitchell', email: null, hours: 40, rate: 18.50 },
      { firstName: 'Sarah', lastName: 'Thompson', email: null, hours: 37.5, rate: 22.00 },
      { firstName: 'David', lastName: 'O\'Brien', email: null, hours: 45, rate: 15.75 },
      { firstName: 'Emma', lastName: 'Williams', email: null, hours: 40, rate: 19.00 },
    ]

    let totalGross = 0

    for (let i = 0; i < dummyWorkers.length; i++) {
      const dw = dummyWorkers[i]
      const existingWorker = workers[i] ?? null
      const workerId = existingWorker?.id ?? null
      const gross = parseFloat((dw.hours * dw.rate).toFixed(2))
      const taxRate = 20
      const taxAmount = parseFloat(((gross * taxRate) / 100).toFixed(2))
      const net = parseFloat((gross - taxAmount).toFixed(2))
      totalGross += gross

      await prisma.payrollEntry.create({
        data: {
          payrollSubmissionId: submission.id,
          workerId,
          workerName: `${dw.firstName} ${dw.lastName}`,
          firstName: dw.firstName,
          lastName: dw.lastName,
          payrollWeek: 'Week ending 06 Jun 2025',
          hoursWorked: dw.hours,
          hourlyRate: dw.rate,
          basicPay: gross,
          grossPay: gross,
          totalGrossPay: gross,
          taxRate,
          taxAmount,
          netToWorker: net,
          payslipStatus: 'PENDING',
        },
      })
    }

    await prisma.payrollSubmission.update({
      where: { id: submission.id },
      data: { totalGrossPay: totalGross },
    })

    return NextResponse.json({ ok: true, submissionId: submission.id, company: company.name, entries: dummyWorkers.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
