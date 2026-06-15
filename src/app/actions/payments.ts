'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function recordPayment(formData: FormData) {
  const invoiceId     = formData.get('invoiceId') as string
  const amount        = parseFloat(formData.get('amount') as string)
  const paymentMethod = (formData.get('paymentMethod') as string) || null
  const reference     = (formData.get('reference') as string) || null
  const notes         = (formData.get('notes') as string) || null
  const dateStr       = formData.get('paymentDate') as string

  if (!invoiceId || !amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invoice and a positive amount are required')
  }

  const paymentDate = dateStr ? new Date(dateStr) : new Date()

  await prisma.payment.create({
    data: { invoiceId, amount, paymentMethod, reference, notes, paymentDate },
  })

  // Recalculate totals from all payments (fresh read to avoid race conditions)
  await syncInvoicePaidAmount(invoiceId)

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  await prisma.payment.delete({ where: { id: paymentId } })
  await syncInvoicePaidAmount(invoiceId)
  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

async function syncInvoicePaidAmount(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  })
  if (!invoice) return

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const paymentStatus =
    totalPaid >= invoice.totalAmount ? 'PAID' :
    totalPaid > 0                    ? 'PARTIAL' : 'UNPAID'

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount:    totalPaid,
      paymentStatus,
      paidAt: paymentStatus === 'PAID' ? new Date() : null,
    },
  })
}

export async function getPayments() {
  return await prisma.payment.findMany({
    orderBy: { paymentDate: 'desc' },
    include: {
      invoice: {
        include: {
          company: true,
        },
      },
    },
  })
}
