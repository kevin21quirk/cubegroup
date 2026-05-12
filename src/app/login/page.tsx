import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { getCompanies } from '@/app/actions/companies'
import { redirect } from 'next/navigation'
import { login } from '@/lib/auth'

async function handleLogin(formData: FormData) {
  'use server'
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const companyId = formData.get('companyId') as string
  
  const user = await login(email, password, companyId)
  
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      redirect('/dashboard')
    } else if (user.companyId) {
      redirect(`/dashboard?companyId=${user.companyId}`)
    } else {
      redirect('/dashboard')
    }
  } else {
    redirect('/login?error=invalid')
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const companies = await getCompanies()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <Image
              src="/logo.png"
              alt="Cube Group"
              width={200}
              height={80}
              className="h-16 w-auto mx-auto"
              priority
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your payroll dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {searchParams.error === 'invalid' && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">
                Invalid email or password. Please try again.
              </p>
            </div>
          )}
          <form action={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="companyId" className="text-sm font-medium">
                Company (Optional)
              </label>
              <select
                id="companyId"
                name="companyId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Companies (Admin View)</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Select a specific company to view only their data
              </p>
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>

            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Super Admin:</p>
              <p>kevin@aibridgesolutions.co.uk</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
