import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UserCog, Shield } from 'lucide-react'
import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export default async function UsersPage() {
  await requireSuperAdmin()
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users and their access
          </p>
        </div>
        <Link href="/dashboard/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length + 1}</div>
            <p className="text-xs text-muted-foreground">Including super admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCog className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role !== 'SUPER_ADMIN').length}</div>
            <p className="text-xs text-muted-foreground">Company-specific access</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Super Admin */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50 dark:bg-green-950">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Kevin (Super Admin)</p>
                  <p className="text-sm text-muted-foreground">kevin@aibridgesolutions.co.uk</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">SUPER_ADMIN</Badge>
                <Badge variant="outline">All Companies</Badge>
              </div>
            </div>

            {/* Regular Users */}
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No users yet</p>
                <p className="text-sm mt-2">Add users to give them access to specific companies</p>
                <Link href="/dashboard/users/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First User
                  </Button>
                </Link>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <UserCog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200">Coming Soon</CardTitle>
          <CardDescription>User management features in development</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Create new users with email/password</p>
          <p>• Assign users to specific companies</p>
          <p>• Edit user permissions and access</p>
          <p>• Delete or deactivate users</p>
          <p>• Password reset functionality</p>
        </CardContent>
      </Card>
    </div>
  )
}
