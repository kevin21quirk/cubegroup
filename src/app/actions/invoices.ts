'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createInvoice(formData: FormData) {
  const companyId = formData.get('companyId') as string
  const payrollSubmissionId = formData.get('payrollSubmissionId') as string
  const invoiceNumber = formData.get('invoiceNumber') as string
  const totalAmount = parseFloat(formData.get('totalAmount') as string)
  const invoiceType = formData.get('invoiceType') as 'CLIENT' | 'UMBRELLA'

  if (!companyId || !invoiceNumber || !totalAmount || !invoiceType) {
    throw new Error('All fields are required')
  }

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      payrollSubmissionId: payrollSubmissionId || undefined,
      invoiceNumber,
      totalAmount,
      invoiceType,
      paymentStatus: 'UNPAID',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  revalidatePath('/dashboard/invoices')
  redirect(`/dashboard/invoices/${invoice.id}`)
}

export async function getInvoices() {
  return await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
      payrollSubmission: true,
    },
  })
}

export async function getInvoice(id: string) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      company: true,
      payrollSubmission: {
        include: {
          payrollEntries: {
            include: {
              worker: true,
            },
          },
        },
      },
      payments: true,
    },
  })
}

export async function markInvoiceAsPaid(id: string) {
  await prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
    },
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
}
