'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
      workflowState: 'PROCESSING',
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

export async function getPayrollSubmission(id: string) {
  return await prisma.payrollSubmission.findUnique({
    where: { id },
    include: {
      company: true,
      payrollEntries: {
        include: {
          worker: true,
        },
      },
      invoice: true,
    },
  })
}
