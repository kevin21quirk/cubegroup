import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Check } from 'lucide-react'
import Link from 'next/link'
import { getCompanies } from '@/app/actions/companies'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SelectCompanyPage() {
  const companies = await getCompanies()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Select Company</CardTitle>
          <CardDescription>
            Choose a company to view their workflows and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No companies available</p>
              <p className="text-sm mt-2">Please add companies first</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {companies.map((company) => (
                <Link 
                  key={company.id} 
                  href={`/dashboard?companyId=${company.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{company.name}</h3>
                      {company.industry && (
                        <p className="text-sm text-muted-foreground">{company.industry}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{company._count.workers} workers</p>
                      <p>{company._count.payrollSubmissions} submissions</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t text-center">
            <Link 
              href="/dashboard" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all companies (Admin)
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
