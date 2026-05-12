import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getPayrollSubmissions } from '@/app/actions/payroll'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function PayrollPage() {
  const submissions = await getPayrollSubmissions()
  
  const totalSubmissions = submissions.length
  const pendingValidation = submissions.filter(s => s.validationStatus === 'PENDING').length
  const processing = submissions.filter(s => s.workflowState === 'PROCESSING').length
  const completed = submissions.filter(s => s.workflowState === 'COMPLETED').length
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Submissions</h1>
          <p className="text-muted-foreground">
            Track and manage all payroll submissions
          </p>
        </div>
        <Link href="/dashboard/payroll/new">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Payroll
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Validation</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingValidation}</div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processing}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Latest payroll submissions from all companies</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No payroll submissions yet</p>
              <p className="text-sm mt-2">Upload your first payroll file or configure email integration</p>
              <Link href="/dashboard/payroll/new">
                <Button className="mt-4" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Payroll File
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <Link key={submission.id} href={`/dashboard/payroll/${submission.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{submission.company.name}</p>
                        <Badge variant={submission.workflowState === 'COMPLETED' ? 'default' : 'secondary'}>
                          {submission.workflowState.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Week: {submission.payrollWeek} • {submission._count.payrollEntries} entries
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(submission.totalGrossPay)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(submission.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
