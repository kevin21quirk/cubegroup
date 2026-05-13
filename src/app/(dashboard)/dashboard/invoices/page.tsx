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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Client Invoices</CardTitle>
            <CardDescription>Invoices sent to client companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">No client invoices</p>
              <p className="text-sm mt-1">Invoices will appear here once payroll is processed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Umbrella Invoices</CardTitle>
            <CardDescription>Invoices from umbrella companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">No umbrella invoices</p>
              <p className="text-sm mt-1">Umbrella invoices will be tracked here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
