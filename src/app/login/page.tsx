import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { redirect } from 'next/navigation'

async function handleLogin(formData: FormData) {
  'use server'
  
  // Temporarily just redirect without auth logic
  redirect('/dashboard')
}

export default async function LoginPage() {
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
          <form action={handleLogin} className="space-y-4">
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
