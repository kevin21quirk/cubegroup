'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getGmailSendService } from '@/services/email/GmailSendService'
import { formatCurrency } from '@/lib/utils'

export async function createInvoice(formData: FormData) {
  const companyId = formData.get('companyId') as string
  const payrollSubmissionId = formData.get('payrollSubmissionId') as string
  const invoiceNumber = formData.get('invoiceNumber') as string
  const totalAmount = parseFloat(formData.get('totalAmount') as string)
  const invoiceType = formData.get('invoiceType') as 'CLIENT_INVOICE' | 'UMBRELLA_INVOICE'

  if (!companyId || !invoiceNumber || !totalAmount || !invoiceType) {
    throw new Error('All fields are required')
  }

  // Get company details for billing name
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      payrollSubmissionId: payrollSubmissionId || undefined,
      invoiceNumber,
      subtotal: totalAmount,
      totalAmount,
      invoiceType,
      paymentStatus: 'UNPAID',
      billingName: company?.name || 'Unknown',
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
      items:    true,
      payments: true,
    },
  })
}

export async function deleteInvoice(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { payrollSubmissionId: true },
  })

  // Delete payments first (no cascade defined on Payment model)
  await prisma.payment.deleteMany({ where: { invoiceId: id } })

  // Delete the invoice (InvoiceItems cascade automatically)
  await prisma.invoice.delete({ where: { id } })

  // Revert the linked payroll submission so workflow goes grey at Invoice Generated
  if (invoice?.payrollSubmissionId) {
    await prisma.payrollSubmission.update({
      where: { id: invoice.payrollSubmissionId },
      data: { workflowState: 'SPREADSHEET_GENERATED' },
    })
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/workflow')
}

export async function emailInvoice(id: string): Promise<{ sent: boolean; to?: string; error?: string }> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { company: true, items: true },
  })
  if (!invoice) return { sent: false, error: 'Invoice not found' }

  const to = (invoice.company as any).invoiceEmail as string | null
  if (!to) return { sent: false, error: 'No invoice email set for this company. Add one in Company Settings.' }

  const itemRows = (invoice.items ?? []).map(i =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${i.description}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(i.unitPrice)}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency(i.amount)}</td>
    </tr>`
  ).join('')

  const issueDate = new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const dueDate   = new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Arial,sans-serif;color:#111;margin:0;padding:0;background:#f9fafb;">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
  <div style="background:#111827;padding:24px 32px;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Invoice ${invoice.invoiceNumber}</h1>
    <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">Cube Group Payroll Services</p>
  </div>
  <div style="padding:24px 32px;">
    <table style="width:100%;font-size:13px;margin-bottom:16px;">
      <tr>
        <td><strong>Billed to:</strong><br/>${invoice.billingName}${invoice.billingAddress ? '<br/>' + invoice.billingAddress : ''}${invoice.billingCity ? '<br/>' + invoice.billingCity : ''}${invoice.billingPostcode ? ' ' + invoice.billingPostcode : ''}</td>
        <td style="text-align:right;vertical-align:top;"><strong>Issue date:</strong> ${issueDate}<br/><strong>Due date:</strong> ${dueDate}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;">Description</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">Unit Price</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="background:#f3f4f6;font-weight:700;">
          <td colspan="3" style="padding:10px 12px;text-align:right;">Total</td>
          <td style="padding:10px 12px;text-align:right;">${formatCurrency(invoice.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="font-size:12px;color:#6b7280;">Payment is due by ${dueDate}. Please reference invoice number <strong>${invoice.invoiceNumber}</strong> when making payment.</p>
  </div>
</div>
</body>
</html>`

  try {
    const sender = getGmailSendService()
    await sender.sendEmail(to, `Invoice ${invoice.invoiceNumber} – ${invoice.billingName}`, html, 'Cube Group')
    return { sent: true, to }
  } catch (err: any) {
    return { sent: false, error: err?.message ?? 'Failed to send email' }
  }
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
