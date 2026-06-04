import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayrollSubmission, deletePayrollSubmission } from '@/app/actions/payroll'
import { PayrollReviewTable } from '@/components/payroll/PayrollReviewTable'
import { LocalTime } from '@/components/ui/local-time'
import { DeleteButton } from '@/components/ui/delete-button'

export const dynamic = 'force-dynamic'

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const submission = await getPayrollSubmission(id)
  if (!submission) notFound()

  const s = submission as any
  const entries = s.payrollEntries ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payroll">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Payroll Manager</h1>
          <p className="text-muted-foreground">Review, adjust tax, approve and send payslips</p>
        </div>
        <Badge variant={s.workflowState === 'COMPLETED' ? 'default' : 'secondary'}>
          {s.workflowState?.replace(/_/g, ' ')}
        </Badge>
        <DeleteButton
          action={async () => { 'use server'; await deletePayrollSubmission(id) }}
          label="payroll submission"
          description={`This will permanently delete the payroll submission for ${s.company.name} (${s.payrollWeek}) and all its entries. This cannot be undone.`}
          redirectTo="/dashboard/payroll"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Building2 className="h-3 w-3" />Company
            </div>
            <p className="font-semibold">{s.company.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="h-3 w-3" />Week
            </div>
            <p className="font-semibold">{s.payrollWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" />Workers
            </div>
            <p className="font-semibold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-xs mb-1">Created</div>
            <p className="font-semibold text-sm">
              <LocalTime date={s.createdAt} fmt="dd MMM yyyy HH:mm" />
            </p>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Entries</CardTitle>
            <CardDescription>No payroll entries found for this submission.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Worker Payroll Entries</CardTitle>
            <CardDescription>
              Adjust tax rates per worker, then approve and send payslips.
              Workers without an email address on file cannot receive payslips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PayrollReviewTable submissionId={id} entries={entries} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
