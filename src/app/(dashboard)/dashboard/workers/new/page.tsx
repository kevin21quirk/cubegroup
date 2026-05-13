import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createWorker } from '@/app/actions/workers'
import { getCompanies } from '@/app/actions/companies'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function NewWorkerPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Worker</h1>
          <p className="text-muted-foreground">
            Create a new worker or contractor
          </p>
        </div>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-medium">No companies available</p>
              <p className="text-sm text-muted-foreground mt-2">
                You need to create a company first before adding workers
              </p>
              <Link href="/dashboard/companies/new">
                <Button className="mt-4">
                  Create Company
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Worker Details</CardTitle>
            <CardDescription>Enter the information for the new worker</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createWorker} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last Name *
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="companyId" className="text-sm font-medium">
                  Company *
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+44 7700 900000"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="nationalInsurance" className="text-sm font-medium">
                  National Insurance Number
                </label>
                <Input
                  id="nationalInsurance"
                  name="nationalInsurance"
                  placeholder="AB123456C"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit">
                Create Worker
              </Button>
              <Link href="/dashboard/workers">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
