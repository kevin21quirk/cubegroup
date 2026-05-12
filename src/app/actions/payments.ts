'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function recordPayment(formData: FormData) {
  const invoiceId = formData.get('invoiceId') as string
  const amount = parseFloat(formData.get('amount') as string)
  const paymentMethod = formData.get('paymentMethod') as string
  const reference = formData.get('reference') as string

  if (!invoiceId || !amount) {
    throw new Error('Invoice and amount are required')
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      paymentMethod,
      reference,
      paymentDate: new Date(),
    },
  })

  // Update invoice payment status
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  })

  if (invoice) {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount
    const paymentStatus = totalPaid >= invoice.totalAmount ? 'PAID' : 
                         totalPaid > 0 ? 'PARTIAL' : 'UNPAID'

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus,
        paidDate: paymentStatus === 'PAID' ? new Date() : null,
      },
    })
  }

  revalidatePath('/dashboard/payments')
  revalidatePath('/dashboard/invoices')
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
