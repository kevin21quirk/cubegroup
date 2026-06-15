import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  Check, Clock, Building2, ChevronRight, Inbox, Cpu,
  FileText, Send, CreditCard, FileSpreadsheet, Users, AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATE_RANK: Record<string, number> = {
  EMAIL_RECEIVED:        1,
  ATTACHMENT_DOWNLOADED: 2,
  AI_PROCESSING:         3,
  VALIDATION_FAILED:     3,
  AWAITING_REVIEW:       3,
  SPREADSHEET_GENERATED: 4,
  SAVED_TO_SERVER:       4,
  READY_FOR_INVOICE:     5,
  INVOICE_SENT:          6,
  AWAITING_PAYMENT:      6,
  PAYMENT_RECEIVED:      7,
  UMBRELLA_INVOICE_SENT: 8,
  COMPLETED:             9,
  FAILED:                0,
}

const PIPELINE = [
  { label: 'Timesheet\nReceived',   minRank: 1, Icon: Inbox },
  { label: 'Data\nProcessed',       minRank: 4, Icon: Cpu },
  { label: 'Invoice\nGenerated',    minRank: 5, Icon: FileText },
  { label: 'Invoice\nSent',         minRank: 6, Icon: Send },
  { label: 'Payment\nReceived',     minRank: 7, Icon: CreditCard },
  { label: 'CSV to\nPayroll Co',    minRank: 8, Icon: FileSpreadsheet },
  { label: 'Payslips\nSent',        minRank: 9, Icon: Users },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

interface WorkflowPageProps {
  searchParams: Promise<{ companyId?: string }>
}

export default async function WorkflowPage({ searchParams }: WorkflowPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const sp = await searchParams
  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  const allCompanies = await prisma.company.findMany({
    where: isSuperAdmin
      ? { isActive: true }
      : { id: { in: session.assignedCompanyIds }, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const activeCompanyId = sp.companyId ?? allCompanies[0]?.id
  const activeCompany   = allCompanies.find(c => c.id === activeCompanyId) ?? allCompanies[0]

  const submissions = await prisma.payrollSubmission.findMany({
    where: { companyId: activeCompany?.id },
    orderBy: { createdAt: 'desc' },
    take: 52,
    include: {
      invoices: {
        select: { id: true, paymentStatus: true, totalAmount: true, paidAmount: true },
      },
      _count: { select: { payrollEntries: true } },
    },
  })

  const byWeek = new Map<string, typeof submissions>()
  for (const s of submissions) {
    const week = s.payrollWeek || s.createdAt.toISOString().split('T')[0]
    if (!byWeek.has(week)) byWeek.set(week, [])
    byWeek.get(week)!.push(s)
  }

  const weeks = [...byWeek.entries()].sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Workflow</h1>
          <p className="text-muted-foreground text-sm mt-0.5">End-to-end pipeline for every payroll period</p>
        </div>

        {allCompanies.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {allCompanies.map(c => (
              <Link
                key={c.id}
                href={`/dashboard/workflow?companyId=${c.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  c.id === activeCompany?.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-muted border-border'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {!activeCompany ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow-sm">
          No companies found. Please contact your administrator.
        </div>
      ) : weeks.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Clock className="mx-auto h-12 w-12 mb-4 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">No payroll periods yet for {activeCompany.name}</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Periods appear here once timesheets are received.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map(([week, subs]) => {
            const isFailed   = subs.every(s => s.workflowState === 'FAILED')
            const rawMaxRank = isFailed ? 0 : Math.max(
              ...subs.filter(s => s.workflowState !== 'FAILED').map(s => STATE_RANK[s.workflowState] ?? 0),
              0,
            )
            const allInvoices  = subs.flatMap(s => s.invoices)
            const hasInvoice   = allInvoices.length > 0
            const hasPaid      = allInvoices.some(i => i.paymentStatus === 'PAID' || i.paymentStatus === 'PARTIAL')
            const invoiceTotal = allInvoices.reduce((n, i) => n + (i.totalAmount ?? 0), 0)
            const workerCount  = subs.reduce((n, s) => n + (s._count?.payrollEntries ?? 0), 0)

            const maxRank = (() => {
              if (isFailed)    return 0
              if (!hasInvoice) return Math.min(rawMaxRank, 4)
              if (!hasPaid)    return Math.min(rawMaxRank, 6)
              return rawMaxRank
            })()

            const isComplete    = hasPaid && maxRank >= 9 && !isFailed
            const stepsComplete = PIPELINE.filter(s => maxRank >= s.minRank).length
            const currentStep   = PIPELINE.find(s => !isFailed && maxRank >= (PIPELINE[PIPELINE.indexOf(s) - 1]?.minRank ?? 0) && maxRank < s.minRank)

            return (
              <div
                key={week}
                className={`rounded-xl border bg-card shadow-sm overflow-hidden transition-colors ${
                  isComplete  ? 'border-green-200 dark:border-green-800' :
                  isFailed    ? 'border-red-200 dark:border-red-900' :
                  'border-border'
                }`}
              >
                {/* Card header */}
                <div className={`flex items-center justify-between px-5 py-3 border-b ${
                  isComplete ? 'bg-green-50/60 dark:bg-green-950/20' :
                  isFailed   ? 'bg-red-50/60 dark:bg-red-950/20' :
                  'bg-muted/30'
                }`}>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-sm">{week}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workerCount} {workerCount === 1 ? 'worker' : 'workers'}
                        {invoiceTotal > 0 && <span className="ml-2 font-medium text-foreground">{fmt(invoiceTotal)}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isFailed ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Failed
                      </Badge>
                    ) : isComplete ? (
                      <Badge className="bg-green-600 hover:bg-green-600 gap-1">
                        <Check className="h-3 w-3" /> Complete
                      </Badge>
                    ) : stepsComplete > 0 ? (
                      <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-50 dark:bg-blue-950/40">
                        <Clock className="h-3 w-3" />
                        {currentStep ? currentStep.label.replace('\n', ' ') : 'In Progress'}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}

                    {subs[0] && (
                      <Link
                        href={`/dashboard/payroll/${subs[0].id}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Stepper */}
                <div className="px-6 py-5">
                  <div className="flex items-start">
                    {PIPELINE.map((step, idx) => {
                      const done    = maxRank >= step.minRank
                      const current = !done && !isFailed && maxRank >= (PIPELINE[idx - 1]?.minRank ?? 0)
                      const isLast  = idx === PIPELINE.length - 1
                      const { Icon } = step

                      return (
                        <div key={step.label} className="flex items-start flex-1 min-w-0">
                          {/* Step node */}
                          <div className="flex flex-col items-center gap-2 w-full">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              done    ? 'bg-green-500 border-green-500 text-white shadow-sm' :
                              current ? 'bg-blue-500 border-blue-500 text-white shadow-sm' :
                              isFailed && idx === 0 ? 'bg-red-500 border-red-500 text-white' :
                              'bg-background border-border text-muted-foreground'
                            }`}>
                              {done ? (
                                <Check className="h-4 w-4 stroke-[2.5]" />
                              ) : current ? (
                                <Icon className="h-4 w-4 animate-pulse" />
                              ) : (
                                <Icon className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <span className={`text-[10px] text-center leading-tight whitespace-pre-line font-medium ${
                              done    ? 'text-green-700 dark:text-green-400' :
                              current ? 'text-blue-600 dark:text-blue-400' :
                              'text-muted-foreground'
                            }`}>
                              {step.label}
                            </span>
                          </div>

                          {/* Connector line */}
                          {!isLast && (
                            <div className="flex-shrink-0 w-full mt-[18px] px-1" style={{ maxWidth: '100%' }}>
                              <div className={`h-0.5 w-full rounded-full transition-all duration-300 ${
                                maxRank >= PIPELINE[idx + 1]?.minRank ? 'bg-green-400' :
                                current ? 'bg-gradient-to-r from-blue-400 to-border' :
                                'bg-border'
                              }`} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 text-xs text-muted-foreground flex-wrap pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-green-500 inline-block" /> Step complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-blue-500 inline-block" /> Currently in progress
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full border-2 border-border inline-block" /> Not yet reached
        </span>
      </div>
    </div>
  )
}
