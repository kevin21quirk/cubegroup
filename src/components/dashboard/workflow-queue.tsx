import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function WorkflowQueue() {
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []
  const companyFilter = isStaff ? { companyId: { in: assignedIds } } : {}

  const rawStats = await prisma.payrollSubmission.groupBy({
    by: ['workflowState'],
    where: companyFilter,
    _count: { workflowState: true },
    orderBy: { workflowState: 'asc' },
  })

  const stats = rawStats.map(s => ({ workflowState: s.workflowState, _count: s._count.workflowState }))

  const stateLabels: Record<string, string> = {
    EMAIL_RECEIVED: 'Email Received',
    ATTACHMENT_DOWNLOADED: 'Attachment Downloaded',
    AI_PROCESSING: 'AI Processing',
    VALIDATION_FAILED: 'Validation Failed',
    AWAITING_REVIEW: 'Awaiting Review',
    SPREADSHEET_GENERATED: 'Spreadsheet Generated',
    SAVED_TO_SERVER: 'Saved to Server',
    READY_FOR_INVOICE: 'Ready for Invoice',
    INVOICE_SENT: 'Invoice Sent',
    AWAITING_PAYMENT: 'Awaiting Payment',
    PAYMENT_RECEIVED: 'Payment Received',
    UMBRELLA_INVOICE_SENT: 'Umbrella Invoice Sent',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  }

  const total = stats.reduce((sum, stat) => sum + stat._count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Queue</CardTitle>
        <CardDescription>Current status of payroll submissions</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No workflow data yet</p>
            <p className="text-sm mt-2">Upload payroll submissions to see workflow status</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((stat) => {
              const percentage = total > 0 ? (stat._count / total) * 100 : 0
              return (
                <div key={stat.workflowState} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {stateLabels[stat.workflowState] || stat.workflowState}
                    </span>
                    <span className="text-muted-foreground">
                      {stat._count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
