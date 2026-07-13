import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Inbox, Archive, Settings, AlertCircle, RefreshCw, Eye, Paperclip, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { formatDistanceToNow } from 'date-fns'
import { EmailRetryButton } from '@/components/emails/email-retry-button'
import { EmailDeleteButton } from '@/components/emails/email-delete-button'

export const dynamic = 'force-dynamic'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',     icon: Clock },
  DOWNLOADING:{ label: 'Downloading',color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',    icon: RefreshCw },
  PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',    icon: RefreshCw },
  EXTRACTING: { label: 'Extracting', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', icon: RefreshCw },
  VALIDATING: { label: 'Validating', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: RefreshCw },
  GENERATING: { label: 'Generating', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', icon: RefreshCw },
  UPLOADING:  { label: 'Uploading',  color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', icon: RefreshCw },
  COMPLETED:  { label: 'Completed',  color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',  icon: CheckCircle },
  FAILED:     { label: 'Failed',     color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',          icon: XCircle },
  RETRY_NEEDED:{ label: 'Retry',     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: AlertCircle },
}

export default async function EmailsPage() {
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []
  // For staff: only emails linked to their company's payroll submissions
  const emailFilter = isStaff
    ? { payrollSubmission: { companyId: { in: assignedIds } } }
    : {}

  const [emails, stats] = await Promise.all([
    prisma.emailImport.findMany({
      where: emailFilter,
      orderBy: { receivedAt: 'desc' },
      take: 100,
      include: {
        attachments: { select: { id: true, status: true, filename: true, fileSize: true } },
        payrollSubmission: { select: { id: true, workflowState: true, payrollWeek: true } },
      },
    }),
    prisma.emailImport.groupBy({
      by: ['processingStatus'],
      where: emailFilter,
      _count: true,
    }),
  ])

  const total = emails.length
  const pending = emails.filter(e => e.processingStatus === 'PENDING').length
  const processing = emails.filter(e => ['DOWNLOADING','PROCESSING','EXTRACTING','VALIDATING','GENERATING','UPLOADING'].includes(e.processingStatus)).length
  const completed = emails.filter(e => e.processingStatus === 'COMPLETED').length
  const failed = emails.filter(e => e.processingStatus === 'FAILED' || e.processingStatus === 'RETRY_NEEDED').length

  const isGmailConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Inbox</h1>
          <p className="text-muted-foreground">Monitor and manage incoming payroll emails</p>
        </div>
        <div className="flex items-center gap-2">
          {isGmailConfigured ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">Gmail Connected</Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Gmail Not Configured</Badge>
          )}
          <Link href="/dashboard/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processing}</div>
            <p className="text-xs text-muted-foreground">In pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failed}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Email list or empty state */}
      <Card>
        <CardHeader>
          <CardTitle>Incoming Emails</CardTitle>
          <CardDescription>Payroll emails received via Gmail webhook</CardDescription>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="mx-auto h-14 w-14 mb-4 text-muted-foreground opacity-40" />
              <p className="text-lg font-medium mb-1">No emails received yet</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {isGmailConfigured
                  ? 'Emails will appear here once Gmail sends payroll emails to the webhook.'
                  : 'Configure Gmail in Settings to start receiving payroll emails automatically.'}
              </p>
              {!isGmailConfigured && (
                <Link href="/dashboard/settings">
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Connect Gmail Account
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">From</th>
                    <th className="pb-3 pr-4 font-medium">Subject</th>
                    <th className="pb-3 pr-4 font-medium">Received</th>
                    <th className="pb-3 pr-4 font-medium">Attachments</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Workflow</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {emails.map((email) => {
                    const status = statusConfig[email.processingStatus] ?? statusConfig.PENDING
                    const StatusIcon = status.icon
                    return (
                      <tr key={email.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="font-medium truncate max-w-[160px]">{email.from}</div>
                          {email.detectedCompany && (
                            <div className="text-xs text-muted-foreground">{email.detectedCompany}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="truncate max-w-[220px]">{email.subject}</div>
                          {email.detectedWeek && (
                            <div className="text-xs text-muted-foreground">Week: {email.detectedWeek}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                          {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                        </td>
                        <td className="py-3 pr-4">
                          {email.attachmentCount > 0 ? (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{email.attachmentCount}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                          {email.errorMessage && (
                            <div className="text-xs text-red-600 mt-0.5 max-w-[160px] truncate" title={email.errorMessage}>
                              {email.errorMessage}
                            </div>
                          )}
                          {email.retryCount > 0 && (
                            <div className="text-xs text-muted-foreground mt-0.5">Retries: {email.retryCount}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {email.payrollSubmission ? (
                            <Link href={`/dashboard/workflow?submissionId=${email.payrollSubmission.id}`}>
                              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                                {email.payrollSubmission.workflowState.replace(/_/g, ' ')}
                              </Badge>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/dashboard/emails/${email.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {!['COMPLETED', 'PROCESSING', 'EXTRACTING', 'VALIDATING', 'GENERATING', 'UPLOADING'].includes(email.processingStatus) && (
                              <EmailRetryButton emailId={email.id} />
                            )}
                            <EmailDeleteButton emailId={email.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
