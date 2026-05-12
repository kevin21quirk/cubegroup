import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createInvoice } from '@/app/actions/invoices'
import { getCompanies } from '@/app/actions/companies'
import { getPayrollSubmissions } from '@/app/actions/payroll'

export default async function NewInvoicePage() {
  const companies = await getCompanies()
  const payrollSubmissions = await getPayrollSubmissions()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">
            Generate a new invoice
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Enter the invoice information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInvoice} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="invoiceType" className="text-sm font-medium">
                  Invoice Type *
                </label>
                <select
                  id="invoiceType"
                  name="invoiceType"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select type...</option>
                  <option value="CLIENT_INVOICE">Client Invoice</option>
                  <option value="UMBRELLA_INVOICE">Umbrella Invoice</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyId" className="text-sm font-medium">
                  Company *
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="invoiceNumber" className="text-sm font-medium">
                  Invoice Number *
                </label>
                <Input
                  id="invoiceNumber"
                  name="invoiceNumber"
                  placeholder="INV-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="totalAmount" className="text-sm font-medium">
                  Total Amount (£) *
                </label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="payrollSubmissionId" className="text-sm font-medium">
                  Link to Payroll Submission (Optional)
                </label>
                <select
                  id="payrollSubmissionId"
                  name="payrollSubmissionId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">None</option>
                  {payrollSubmissions.map((submission) => (
                    <option key={submission.id} value={submission.id}>
                      {submission.company.name} - {submission.payrollWeek}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit">
                Create Invoice
              </Button>
              <Link href="/dashboard/invoices">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
