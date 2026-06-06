import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, Mail, Phone, Users } from 'lucide-react'
import Link from 'next/link'
import { getUmbrellaCompanies } from '@/app/actions/umbrella-companies'

export const dynamic = 'force-dynamic'

export default async function UmbrellaCompaniesPage() {
  const companies = await getUmbrellaCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Umbrella Payroll Companies</h1>
          <p className="text-muted-foreground">Manage umbrella companies and their payroll CSV recipients</p>
        </div>
        <Link href="/dashboard/umbrella-companies/new">
          <Button><Plus className="mr-2 h-4 w-4" />Add Company</Button>
        </Link>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No umbrella companies yet</p>
            <p className="text-sm mt-1">Add an umbrella company to enable automated CSV dispatch on payment</p>
            <Link href="/dashboard/umbrella-companies/new">
              <Button className="mt-4"><Plus className="mr-2 h-4 w-4" />Add Company</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map(company => (
            <Link key={company.id} href={`/dashboard/umbrella-companies/${company.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{company.name}</CardTitle>
                    <Badge variant={company.isActive ? 'default' : 'secondary'}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{company.contactEmail}</span>
                  </div>
                  {company.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{company.contactPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{company._count.payrollEntries} payroll entries</span>
                  </div>
                  {company.processingFee > 0 && (
                    <p className="text-xs">Processing fee: £{company.processingFee.toFixed(2)}/worker</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
