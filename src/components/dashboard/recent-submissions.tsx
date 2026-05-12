import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export async function RecentSubmissions() {
  const submissions = await prisma.payrollSubmission.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      company: true,
    },
  })

  const getStatusColor = (state: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      AWAITING_VALIDATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
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
