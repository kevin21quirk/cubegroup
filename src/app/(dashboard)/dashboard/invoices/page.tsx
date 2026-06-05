import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, Plus, Download, DollarSign, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getInvoices } from '@/app/actions/invoices'
import { formatDate, formatCurrency } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const invoices = await getInvoices()
  
  const totalInvoices = invoices.length
  const unpaidAmount = invoices.filter(i => i.paymentStatus === 'UNPAID').reduce((sum, i) => sum + i.totalAmount, 0)
  const paidThisMonth = invoices.filter(i => i.paymentStatus === 'PAID' && i.paidAt && new Date(i.paidAt).getMonth() === new Date().getMonth()).reduce((sum, i) => sum + i.totalAmount, 0)
  const totalRevenue = invoices.reduce((sum, i) => sum + i.totalAmount, 0)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage client and umbrella company invoices
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(unpaidAmount)}</div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(paidThisMonth)}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total invoiced</p>
          </CardContent>
        </Card>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Invoices will appear here once payroll is processed</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2.5">Invoice #</th>
                    <th className="text-left px-3 py-2.5">Company</th>
                    <th className="text-left px-3 py-2.5">Type</th>
                    <th className="text-left px-3 py-2.5">Issued</th>
                    <th className="text-left px-3 py-2.5">Due</th>
                    <th className="text-right px-3 py-2.5">Total</th>
                    <th className="text-center px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium text-primary hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{inv.company?.name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{inv.invoiceType === 'CLIENT_INVOICE' ? 'Client' : 'Umbrella'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-medium">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={inv.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
