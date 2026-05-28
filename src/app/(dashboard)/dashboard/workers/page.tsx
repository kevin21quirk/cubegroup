import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Mail, Phone, Building2, Briefcase, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { getWorkers } from '@/app/actions/workers'
import { formatDate } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const workers = await getWorkers()

  const activeWorkers = workers.filter(w => w.isActive).length
  const totalPayrollEntries = workers.reduce((sum, w) => sum + w._count.payrollEntries, 0)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">
            Manage contractors and workers across all companies
          </p>
        </div>
        <Link href="/dashboard/workers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Worker
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">Total workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers}</div>
            <p className="text-xs text-muted-foreground">Active workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayrollEntries}</div>
            <p className="text-xs text-muted-foreground">Payroll entries</p>
          </CardContent>
        </Card>
      </div>

      {workers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Worker Directory</CardTitle>
            <CardDescription>All registered workers and contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No workers yet</p>
              <p className="text-sm mt-2">Add workers to start tracking payroll</p>
              <Link href="/dashboard/workers/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Worker
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Worker Directory</CardTitle>
            <CardDescription>{workers.length} registered workers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workers.map((worker) => (
                <Link key={worker.id} href={`/dashboard/workers/${worker.id}`}>
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{worker.firstName} {worker.lastName}</p>
                          <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                            {worker.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {(worker as any).cisStatus && (
                            <Badge variant="outline" className="text-xs">CIS: {(worker as any).cisStatus}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{worker.company.name}</span>
                          </div>
                          {(worker as any).nationalInsurance && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              <span className="font-mono">{(worker as any).nationalInsurance}</span>
                            </div>
                          )}
                          {(worker as any).jobDescription && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              <span className="truncate max-w-[140px]">{(worker as any).jobDescription}</span>
                            </div>
                          )}
                          {worker.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[160px]">{worker.email}</span>
                            </div>
                          )}
                          {(worker as any).agency && (
                            <span className="text-muted-foreground/70">via {(worker as any).agency}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-medium">{worker._count.payrollEntries} entries</p>
                      <p className="text-xs text-muted-foreground">Added {formatDate(worker.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
