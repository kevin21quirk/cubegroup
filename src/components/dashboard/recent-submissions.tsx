import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function RecentSubmissions() {
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []
  const companyFilter = isStaff ? { companyId: { in: assignedIds } } : {}

  const submissions = await prisma.payrollSubmission.findMany({
    where: companyFilter,
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { company: true },
  })

  const getStatusColor = (state: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      EMAIL_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      ATTACHMENT_DOWNLOADED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      AI_PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      VALIDATION_FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      AWAITING_REVIEW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      SPREADSHEET_GENERATED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      SAVED_TO_SERVER: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      READY_FOR_INVOICE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      INVOICE_SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      AWAITING_PAYMENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      PAYMENT_RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      UMBRELLA_INVOICE_SENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    }
    return colors[state] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>Latest payroll submissions from companies</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payroll submissions yet</p>
            <p className="text-sm mt-2">Add companies and upload payroll data to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/dashboard/payroll/${submission.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{submission.company.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Week: {submission.payrollWeek}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      £{submission.totalGrossPay.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(submission.createdAt)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(submission.workflowState)}>
                    {submission.workflowState.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
