import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Users, FileText, Edit, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompany, deleteCompany } from '@/app/actions/companies'
import { LocalTime } from '@/components/ui/local-time'
import { DeleteButton } from '@/components/ui/delete-button'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await getCompany(id)
  if (!company) notFound()

  const c = company as any

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/companies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          <Badge variant={c.isActive ? 'default' : 'secondary'} className="mt-1">
            {c.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/companies/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <DeleteButton
            action={deleteCompany.bind(null, id)}
            label="Company"
            description="This will permanently delete the company and all associated data including workers and payroll submissions. This cannot be undone."
            redirectTo="/dashboard/companies"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {c.contacts?.[0]?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{c.contacts[0].email}</span>
              </div>
            )}
            {c.contacts?.[0]?.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{c.contacts[0].phone}</span>
              </div>
            )}
            {c.billingAddress && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{c.billingAddress}</span>
              </div>
            )}
            {c.companyNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span>Company No: {c.companyNumber}</span>
              </div>
            )}
            {c.vatNumber && (
              <div className="text-muted-foreground">VAT: {c.vatNumber}</div>
            )}
            <div className="pt-2 border-t text-muted-foreground">
              Added <LocalTime date={company.createdAt} fmt="dd MMM yyyy HH:mm" />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{company.workers.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Workers</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{company.payrollSubmissions.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workers */}
      {company.workers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workers
            </CardTitle>
            <CardDescription>{company.workers.length} registered</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.workers.map((w: any) => (
                <Link key={w.id} href={`/dashboard/workers/${w.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors">
                    <div>
                      <p className="font-medium">{w.firstName} {w.lastName}</p>
                      {w.email && <p className="text-sm text-muted-foreground">{w.email}</p>}
                    </div>
                    <Badge variant={w.isActive ? 'default' : 'secondary'}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent submissions */}
      {company.payrollSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Payroll Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {company.payrollSubmissions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div>
                    <p className="font-medium">{s.weekEnding ?? s.payrollWeek ?? 'Week'}</p>
                    <p className="text-muted-foreground"><LocalTime date={s.createdAt} fmt="dd MMM yyyy HH:mm" /></p>
                  </div>
                  <Badge variant={s.status === 'COMPLETED' ? 'default' : 'secondary'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
