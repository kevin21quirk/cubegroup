import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Calendar, Receipt, FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInvoice, deleteInvoice, emailInvoice, markInvoicePaidAndSendUmbrella } from '@/app/actions/invoices'
import { recordPayment, deletePayment } from '@/app/actions/payments'
import { DeleteButton } from '@/components/ui/delete-button'
import { LocalTime } from '@/components/ui/local-time'
import { formatCurrency } from '@/lib/utils'
import { EmailInvoiceButton } from '@/components/invoices/EmailInvoiceButton'
import { InvoicePaidButton } from '@/components/invoices/InvoicePaidButton'
import { PartialPaymentSection } from '@/components/invoices/PartialPaymentSection'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const isPaid    = invoice.paymentStatus === 'PAID'
  const isPartial  = invoice.paymentStatus === 'PARTIAL'
  const paidAmount = (invoice as any).paidAmount ?? 0

  // Compute payroll company (umbrella) totals from payroll entries
  const entries = (invoice.payrollSubmission as any)?.payrollEntries ?? []
  const umbrellaTotal = entries.reduce((s: number, e: any) => s + (e.umbrellaShareAmount ?? 0), 0)
  const umbrellaName  = (invoice.payrollSubmission as any)?.company?.umbrellaCompany?.name
    ?? entries.find((e: any) => e.umbrellaCompany)?.umbrellaCompany?.name
    ?? null
  const umbrellaCsvSent = [
    'UMBRELLA_INVOICE_SENT', 'COMPLETED', 'PAYMENT_RECEIVED'
  ].includes((invoice.payrollSubmission as any)?.workflowState ?? '')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground text-sm">
            {invoice.invoiceType === 'CLIENT_INVOICE' ? 'Client Invoice' : 'Umbrella Invoice'}
          </p>
        </div>
        <Badge
          variant={isPaid ? 'default' : isPartial ? 'secondary' : 'outline'}
          className="text-sm px-3 py-1"
        >
          {isPaid ? 'Paid' : isPartial ? 'Part Paid' : 'Unpaid'}
        </Badge>
      </div>

      {/* Invoice header details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Building2 className="h-3 w-3" /> Billed To
            </div>
            <p className="font-semibold">{invoice.billingName}</p>
            {invoice.billingAddress  && <p className="text-sm text-muted-foreground">{invoice.billingAddress}</p>}
            {invoice.billingCity     && <p className="text-sm text-muted-foreground">{invoice.billingCity}</p>}
            {invoice.billingPostcode && <p className="text-sm text-muted-foreground">{invoice.billingPostcode}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" /> Dates
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issue date</span>
              <span className="font-medium"><LocalTime date={invoice.issueDate} fmt="dd MMM yyyy" /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium"><LocalTime date={invoice.dueDate} fmt="dd MMM yyyy" /></span>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-600"><LocalTime date={invoice.paidAt} fmt="dd MMM yyyy" /></span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Receipt className="h-3 w-3" /> Summary
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium">Description</th>
                  <th className="text-center px-3 py-2.5 font-medium">Qty</th>
                  <th className="text-right px-3 py-2.5 font-medium">Unit Price</th>
                  <th className="text-right px-3 py-2.5 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2.5">{item.description}</td>
                    <td className="px-3 py-2.5 text-center tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                {!invoice.items?.length && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No line items</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-muted font-semibold">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right">Total</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment reconciliation */}
      <PartialPaymentSection
        invoiceId={id}
        totalAmount={invoice.totalAmount}
        paidAmount={paidAmount}
        paymentStatus={invoice.paymentStatus}
        payments={(invoice.payments ?? []).map((p: any) => ({
          id: p.id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          reference: p.reference,
          notes: p.notes,
        }))}
        recordAction={recordPayment}
        deleteAction={deletePayment}
        umbrellaTotal={umbrellaTotal}
        umbrellaName={umbrellaName}
        umbrellaCsvSent={umbrellaCsvSent}
      />

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isPaid && (
          <InvoicePaidButton action={markInvoicePaidAndSendUmbrella.bind(null, id)} />
        )}
        <EmailInvoiceButton action={emailInvoice.bind(null, id)} invoiceEmail={(invoice.company as any)?.invoiceEmail ?? null} />
        {invoice.payrollSubmission && (
          <Link href={`/dashboard/payroll/${invoice.payrollSubmissionId}`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Payroll Submission
            </Button>
          </Link>
        )}
        <DeleteButton
          action={deleteInvoice.bind(null, id)}
          label={`invoice ${invoice.invoiceNumber}`}
          description="This will permanently delete the invoice and revert the workflow to before invoice generation. This cannot be undone."
          redirectTo="/dashboard/invoices"
        />
      </div>
    </div>
  )
}
