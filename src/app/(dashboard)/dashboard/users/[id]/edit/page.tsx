import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getUser, updateUser } from '@/app/actions/users'
import { getCompanies } from '@/app/actions/companies'
import { requireSuperAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  await requireSuperAdmin()
  
  try {
    const { id } = await params
    const user = await getUser(id)
    const companies = await getCompanies()
    
    if (!user) {
      notFound()
    }

    const updateUserWithId = updateUser.bind(null, id)
  
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-muted-foreground">
              Update user information and permissions
            </p>
          </div>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Edit the user information</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateUserWithId} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.firstName || ''}
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
                  defaultValue={user.lastName || ''}
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email || ''}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password (Optional)
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Leave blank to keep current"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Only enter a password if you want to change it
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  User Role *
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={user.role}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="SUPER_ADMIN">Super Admin - Full system access</option>
                  <option value="STAFF">Staff - Company-specific access</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="companyId" className="text-sm font-medium">
                  Default Company (Optional)
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  defaultValue={user.companyId || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No default (user selects at login)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Staff users select a company at login. This sets their default.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button type="submit">
                Save Changes
              </Button>
              <Link href="/dashboard/users">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    )
  } catch (error) {
    console.error('Error loading user:', error)
    notFound()
  }
}
}
