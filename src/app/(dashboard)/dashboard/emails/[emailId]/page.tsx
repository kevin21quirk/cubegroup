import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Paperclip, Clock, Mail, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { EmailRetryButton } from '@/components/emails/email-retry-button'

export const dynamic = 'force-dynamic'

export default async function EmailDetailPage({ params }: { params: { emailId: string } }) {
  const email = await prisma.emailImport.findUnique({
    where: { id: params.emailId },
    include: {
      attachments: true,
      workflowLogs: { orderBy: { createdAt: 'asc' } },
      payrollSubmission: {
        include: {
          company: { select: { name: true } },
          validationErrorsList: true,
          generatedSpreadsheet: true,
        },
      },
    },
  })

  if (!email) notFound()

  const attachmentStatusColor: Record<string, string> = {
    PENDING:    'bg-gray-100 text-gray-700',
    DOWNLOADED: 'bg-blue-100 text-blue-700',
    PROCESSING: 'bg-yellow-100 text-yellow-700',
    EXTRACTED:  'bg-green-100 text-green-700',
    FAILED:     'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/emails">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inbox
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">{email.subject}</h1>
          <p className="text-muted-foreground text-sm">From: {email.from}</p>
        </div>
        {(email.processingStatus === 'FAILED' || email.processingStatus === 'RETRY_NEEDED') && (
          <EmailRetryButton emailId={email.id} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Email details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Details
                </CardTitle>
                <Badge variant="outline">{email.processingStatus.replace(/_/g, ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground font-medium">From</p>
                  <p>{email.from}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Received</p>
                  <p>{format(new Date(email.receivedAt), 'dd MMM yyyy HH:mm')}</p>
                </div>
                {email.detectedCompany && (
                  <div>
                    <p className="text-muted-foreground font-medium">Detected Company</p>
                    <p>{email.detectedCompany}</p>
                  </div>
                )}
                {email.detectedWeek && (
                  <div>
                    <p className="text-muted-foreground font-medium">Detected Week</p>
                    <p>{email.detectedWeek}</p>
                  </div>
                )}
              </div>
              {email.errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Error</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{email.errorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {email.bodyText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Body</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground bg-muted/30 rounded p-3 max-h-60 overflow-y-auto">
                  {email.bodyText}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({email.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {email.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{att.originalFilename}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.mimeType} · {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${attachmentStatusColor[att.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {att.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Workflow logs */}
          {email.workflowLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Processing Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative border-l border-muted-foreground/20 ml-3 space-y-4">
                  {email.workflowLogs.map((log, i) => (
                    <li key={log.id} className="ml-6">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                      <p className="text-sm font-medium">{log.state.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                      {log.errorDetails && (
                        <p className="text-xs text-red-600 mt-0.5">{log.errorDetails}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(log.createdAt), 'HH:mm:ss dd MMM')}
                        {log.duration && ` · ${log.duration}ms`}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-6">
          {email.payrollSubmission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payroll Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground font-medium">Company</p>
                  <p>{email.payrollSubmission.company.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Payroll Week</p>
                  <p>{email.payrollSubmission.payrollWeek}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Workflow State</p>
                  <Badge variant="outline" className="text-xs">
                    {email.payrollSubmission.workflowState.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {email.payrollSubmission.validationErrorsList.length > 0 && (
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Validation Errors</p>
                    <div className="space-y-1">
                      {email.payrollSubmission.validationErrorsList.map((err) => (
                        <div key={err.id} className="p-2 bg-red-50 dark:bg-red-950 rounded text-xs">
                          <span className="font-medium text-red-700">{err.errorType}:</span>{' '}
                          <span className="text-red-600">{err.errorMessage}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {email.payrollSubmission.generatedSpreadsheet && (
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Generated File</p>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-700">{email.payrollSubmission.generatedSpreadsheet.filename}</span>
                    </div>
                  </div>
                )}
                <Link href={`/dashboard/workflow?submissionId=${email.payrollSubmission.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View in Workflow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Message ID</span>
                <span className="font-mono text-xs truncate max-w-[120px]" title={email.messageId}>{email.messageId.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retries</span>
                <span>{email.retryCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attachments</span>
                <span>{email.attachmentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed</span>
                <span>{email.isProcessed ? format(new Date(email.processedAt!), 'dd MMM HH:mm') : '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
