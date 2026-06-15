import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { CheckCircle2, Circle, Clock, Building2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Map actual WorkflowState enum values to a numeric rank for pipeline display
const STATE_RANK: Record<string, number> = {
  EMAIL_RECEIVED:        1,
  ATTACHMENT_DOWNLOADED: 2,
  AI_PROCESSING:         3,
  VALIDATION_FAILED:     3,  // still in processing phase
  AWAITING_REVIEW:       3,  // still in processing phase
  SPREADSHEET_GENERATED: 4,
  SAVED_TO_SERVER:       5,  // files delivered to server
  READY_FOR_INVOICE:     5,  // same display stage
  INVOICE_SENT:          6,  // invoice generated & sent
  AWAITING_PAYMENT:      6,  // same display stage
  PAYMENT_RECEIVED:      7,
  UMBRELLA_INVOICE_SENT: 8,
  COMPLETED:             9,
  FAILED:                0,  // treated separately — never ticks pipeline steps
}

const PIPELINE = [
  { label: 'Timesheet\nReceived',  minRank: 1 },
  { label: 'Data\nProcessed',      minRank: 4 },
  { label: 'Files\nDelivered',     minRank: 5 },
  { label: 'Invoice\nSent',        minRank: 6 },
  { label: 'Payment\nReceived',    minRank: 7 },
]

interface WorkflowPageProps {
  searchParams: Promise<{ companyId?: string }>
}

export default async function WorkflowPage({ searchParams }: WorkflowPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const sp = await searchParams
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  // Determine which companies the user can see
  const allCompanies = await prisma.company.findMany({
    where: isSuperAdmin
      ? { isActive: true }
      : session.assignedCompanyIds.length > 0
        ? { id: { in: session.assignedCompanyIds }, isActive: true }
        : { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  // Determine the active company: use query param, or default to first
  const activeCompanyId = sp.companyId ?? allCompanies[0]?.id
  const activeCompany   = allCompanies.find(c => c.id === activeCompanyId) ?? allCompanies[0]

  // Fetch submissions for the active company with their linked invoices
  const submissions = await prisma.payrollSubmission.findMany({
    where: { companyId: activeCompany?.id },
    orderBy: { createdAt: 'desc' },
    take: 52, // last year of weekly periods
    include: {
      invoices: {
        select: { id: true, paymentStatus: true, totalAmount: true, paidAmount: true },
      },
      _count: { select: { payrollEntries: true } },
    },
  })

  // Group by payrollWeek
  const byWeek = new Map<string, typeof submissions>()
  for (const s of submissions) {
    const week = s.payrollWeek || s.createdAt.toISOString().split('T')[0]
    if (!byWeek.has(week)) byWeek.set(week, [])
    byWeek.get(week)!.push(s)
  }

  // Sort weeks descending
  const weeks = [...byWeek.entries()].sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Workflow</h1>
          <p className="text-muted-foreground text-sm">Period-by-period pipeline view</p>
        </div>
        {/* Company selector (all admins + multi-company staff) */}
        {allCompanies.length > 1 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              {allCompanies.map(c => (
                <Link
                  key={c.id}
                  href={`/dashboard/workflow?companyId=${c.id}`}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                    c.id === activeCompany?.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted border-border'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!activeCompany ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No companies found. Please contact your administrator.
          </CardContent>
        </Card>
      ) : weeks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">No payroll periods yet for {activeCompany.name}</p>
            <p className="text-sm mt-1">Periods will appear here once timesheets are submitted.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{activeCompany.name} — All Periods</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="grid items-center border-b bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground"
              style={{ gridTemplateColumns: '1fr 1fr repeat(5, 1fr) auto' }}>
              <span>Period</span>
              <span>Workers</span>
              {PIPELINE.map(s => (
                <span key={s.label} className="text-center whitespace-pre-line leading-tight">
                  {s.label}
                </span>
              ))}
              <span />
            </div>

            <div className="divide-y">
              {weeks.map(([week, subs]) => {
                // Use the highest-ranked non-failed submission state
                const isFailed    = subs.every(s => s.workflowState === 'FAILED')
                const maxRank     = isFailed ? 0 : Math.max(
                  ...subs
                    .filter(s => s.workflowState !== 'FAILED')
                    .map(s => STATE_RANK[s.workflowState] ?? 0),
                  0
                )
                const allInvoices = subs.flatMap(s => s.invoices)

                // Complete only if genuinely at/past payment — not just COMPLETED from an early skip
                const isComplete  = maxRank >= STATE_RANK.PAYMENT_RECEIVED && !isFailed


                return (
                  <div key={week} className={`grid items-center px-4 py-3 hover:bg-muted/40 transition-colors ${isComplete ? 'bg-green-50/40 dark:bg-green-950/10' : ''}`}
                    style={{ gridTemplateColumns: '1fr 1fr repeat(5, 1fr) auto' }}>

                    {/* Period label */}
                    <div>
                      <p className="text-sm font-medium">{week}</p>
                      {isFailed && <Badge variant="destructive" className="text-xs mt-0.5">Failed</Badge>}
                    </div>

                    {/* Worker count */}
                    <div className="text-sm text-muted-foreground">
                      {subs.reduce((n, s) => n + (s._count?.payrollEntries ?? 0), 0)} workers
                    </div>

                    {/* Pipeline step dots */}
                    {PIPELINE.map((step, idx) => {
                      const done    = maxRank >= step.minRank
                      const current = !done && maxRank >= (PIPELINE[idx - 1]?.minRank ?? 0)
                      return (
                        <div key={step.label} className="flex justify-center">
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : current ? (
                            <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </div>
                      )
                    })}

                    {/* Link to submission */}
                    <div className="flex justify-end">
                      {subs[0] && (
                        <Link href={`/dashboard/payroll/${subs[0].id}`}
                          className="text-muted-foreground hover:text-foreground transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex gap-5 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-green-600" /> Step complete</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-500" /> In progress</span>
        <span className="flex items-center gap-1.5"><Circle className="h-4 w-4 text-gray-300" /> Not started</span>
      </div>
    </div>
  )
}
