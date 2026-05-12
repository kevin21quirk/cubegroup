import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createPayrollSubmission } from '@/app/actions/payroll'
import { getCompanies } from '@/app/actions/companies'

export default async function NewPayrollPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payroll">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Payroll</h1>
          <p className="text-muted-foreground">
            Create a new payroll submission
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Details</CardTitle>
          <CardDescription>Enter the payroll information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPayrollSubmission} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
                <label htmlFor="payrollWeek" className="text-sm font-medium">
                  Payroll Week *
                </label>
                <Input
                  id="payrollWeek"
                  name="payrollWeek"
                  placeholder="e.g., Week 20, 2024"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="totalGrossPay" className="text-sm font-medium">
                  Total Gross Pay (£) *
                </label>
                <Input
                  id="totalGrossPay"
                  name="totalGrossPay"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="totalEmployerNI" className="text-sm font-medium">
                  Total Employer NI (£)
                </label>
                <Input
                  id="totalEmployerNI"
                  name="totalEmployerNI"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="totalPension" className="text-sm font-medium">
                  Total Pension (£)
                </label>
                <Input
                  id="totalPension"
                  name="totalPension"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit">
                Create Payroll Submission
              </Button>
              <Link href="/dashboard/payroll">
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
