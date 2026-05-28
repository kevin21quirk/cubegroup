import { WorkflowVisualization, getDefaultWorkflowSteps } from '@/components/workflow/workflow-visualization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getPayrollSubmissions } from '@/app/actions/payroll'
import { getInvoices } from '@/app/actions/invoices'
import { getPayments } from '@/app/actions/payments'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface WorkflowPageProps {
  searchParams: { companyId?: string }
}

export default async function WorkflowPage({ searchParams }: WorkflowPageProps) {
  const companyId = searchParams.companyId

  // Get company if filtered
  const company = companyId ? await prisma.company.findUnique({
    where: { id: companyId },
  }) : null

  // Get workflow data (filtered by company if selected)
  const [submissions, invoices, payments, emailImports] = await Promise.all([
    getPayrollSubmissions(),
    getInvoices(),
    getPayments(),
    prisma.emailImport.findMany({
      where: companyId ? { payrollSubmission: { companyId } } : undefined,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Filter by company if selected
  const filteredSubmissions = companyId 
    ? submissions.filter(s => s.company.id === companyId)
    : submissions

  const filteredInvoices = companyId
    ? invoices.filter(i => i.company?.id === companyId)
    : invoices

  // Calculate workflow step statuses
  const steps = getDefaultWorkflowSteps()

  // Email Received
  steps[0].count = emailImports.length
  steps[0].status = emailImports.length > 0 ? 'completed' : 'pending'

  // Timesheet Processed
  steps[1].count = filteredSubmissions.length
  steps[1].status = filteredSubmissions.length > 0 ? 'completed' : 
                    emailImports.length > 0 ? 'in_progress' : 'pending'

  // Validation
  const validated = filteredSubmissions.filter(s => 
    s.workflowState !== 'EMAIL_RECEIVED' && 
    s.workflowState !== 'ATTACHMENT_DOWNLOADED' && 
    s.workflowState !== 'AI_PROCESSING'
  )
  steps[2].count = validated.length
  steps[2].status = validated.length > 0 ? 'completed' :
                    filteredSubmissions.length > 0 ? 'in_progress' : 'pending'

  // Invoice Generated
  steps[3].count = filteredInvoices.length
  steps[3].status = filteredInvoices.length > 0 ? 'completed' :
                    validated.length > 0 ? 'in_progress' : 'pending'

  // Payment
  const paidInvoices = filteredInvoices.filter(i => i.paymentStatus === 'PAID')
  steps[4].count = paidInvoices.length
  steps[4].status = paidInvoices.length > 0 ? 'completed' :
                    filteredInvoices.length > 0 ? 'in_progress' : 'pending'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {company ? `${company.name} - Workflow` : 'Workflow Overview'}
        </h1>
        <p className="text-muted-foreground">
          Visual representation of the payroll processing workflow
        </p>
      </div>

      <WorkflowVisualization 
        companyName={company?.name}
        steps={steps}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Emails</p>
          <p className="text-2xl font-bold">{emailImports.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Timesheets</p>
          <p className="text-2xl font-bold">{filteredSubmissions.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Validated</p>
          <p className="text-2xl font-bold">{validated.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Invoices</p>
          <p className="text-2xl font-bold">{filteredInvoices.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold">{paidInvoices.length}</p>
        </div>
      </div>
    </div>
  )
}
