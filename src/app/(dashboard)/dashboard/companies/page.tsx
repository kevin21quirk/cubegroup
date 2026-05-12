import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Users, FileText, Mail, Phone, MapPin, Edit } from 'lucide-react'
import Link from 'next/link'
import { getCompanies } from '@/app/actions/companies'
import { formatDate } from '@/lib/utils'

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">
            Manage your client companies and their details
          </p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Company Directory</CardTitle>
            <CardDescription>All registered client companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No companies yet</p>
              <p className="text-sm mt-2">Add your first client company to get started</p>
              <Link href="/dashboard/companies/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Company
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/companies/${company.id}`} className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <Badge variant={company.isActive ? "default" : "secondary"} className="mt-1">
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </Link>
                  <Link href={`/dashboard/companies/${company.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
                <CardContent className="space-y-3">
                  {company.contacts[0]?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{company.contacts[0].email}</span>
                    </div>
                  )}
                  {company.contacts[0]?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{company.contacts[0].phone}</span>
                    </div>
                  )}
                  {company.billingAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{company.billingAddress}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Workers</span>
                      </div>
                      <p className="text-lg font-semibold">{company._count.workers}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Submissions</span>
                      </div>
                      <p className="text-lg font-semibold">{company._count.payrollSubmissions}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Added {formatDate(company.createdAt)}
                  </p>
                </CardContent>
              </Card>
          ))}
        </div>
      )}
    </div>
  )
}
