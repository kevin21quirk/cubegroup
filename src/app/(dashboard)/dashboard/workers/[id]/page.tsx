import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Building2, CreditCard, Phone, Mail, MapPin, FileText, Briefcase, Pencil } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorker, deleteWorker } from '@/app/actions/workers'
import { LocalTime } from '@/components/ui/local-time'
import { DeleteButton } from '@/components/ui/delete-button'

export const dynamic = 'force-dynamic'

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const worker = await getWorker(id)
  if (!worker) notFound()

  const w = worker as any

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workers">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{worker.firstName} {worker.lastName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={w.isActive ? 'default' : 'secondary'}>{w.isActive ? 'Active' : 'Inactive'}</Badge>
            {w.cisStatus && <Badge variant="outline">CIS: {w.cisStatus}</Badge>}
          </div>
        </div>
        <Link href={`/dashboard/workers/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />Edit
          </Button>
        </Link>
        <DeleteButton
          action={deleteWorker.bind(null, id)}
          label="Worker"
          description={`This will permanently delete ${worker.firstName} ${worker.lastName} and all their payroll history. This cannot be undone.`}
          redirectTo="/dashboard/workers"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <Link href={`/dashboard/companies/${worker.company.id}`} className="hover:underline">
                {worker.company.name}
              </Link>
            </div>
            {worker.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{worker.email}</span>
              </div>
            )}
            {w.mobile && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{w.mobile}</span>
              </div>
            )}
            {w.nationalInsurance && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="font-mono">{w.nationalInsurance}</span>
              </div>
            )}
            {w.utrNumber && (
              <div className="text-muted-foreground">UTR: <span className="font-mono">{w.utrNumber}</span></div>
            )}
            {w.dateOfBirth && (
              <div className="text-muted-foreground">
                DOB: <LocalTime date={w.dateOfBirth} fmt="dd MMM yyyy HH:mm" />
              </div>
            )}
            {(w.addressLine1 || w.town || w.postCode) && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {[w.addressLine1, w.addressLine2, w.town, w.county, w.postCode].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            <div className="pt-2 border-t text-muted-foreground">
              Added <LocalTime date={worker.createdAt} fmt="dd MMM yyyy HH:mm" />
            </div>
          </CardContent>
        </Card>

        {/* Employment details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {w.jobDescription && (
              <div><span className="font-medium">Role: </span>{w.jobDescription}</div>
            )}
            {w.agency && (
              <div><span className="font-medium">Agency: </span>{w.agency}</div>
            )}
            {w.taxCode && (
              <div><span className="font-medium">Tax Code: </span>{w.taxCode}</div>
            )}
            {w.payFrequency && (
              <div><span className="font-medium">Pay Frequency: </span>{w.payFrequency}</div>
            )}
            {w.startDate && (
              <div><span className="font-medium">Start Date: </span>
                <LocalTime date={w.startDate} fmt="dd MMM yyyy HH:mm" />
              </div>
            )}
            {w.bankName && (
              <div><span className="font-medium">Bank: </span>{w.bankName}
                {w.bankSortCode && ` (${w.bankSortCode})`}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payroll history */}
      {worker.payrollEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payroll History
            </CardTitle>
            <CardDescription>{worker.payrollEntries.length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {worker.payrollEntries.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <p className="font-medium">{e.payrollWeek ?? e.weekEnding ?? '—'}</p>
                    <p className="text-muted-foreground"><LocalTime date={e.createdAt} fmt="dd MMM yyyy HH:mm" /></p>
                  </div>
                  <div className="text-right">
                    {e.totalGrossPay > 0 && (
                      <p className="font-medium">£{Number(e.totalGrossPay).toFixed(2)}</p>
                    )}
                    {e.hoursWorked > 0 && (
                      <p className="text-muted-foreground">{e.hoursWorked}h</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
