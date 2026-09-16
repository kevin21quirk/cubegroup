import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Mail, Building2, Briefcase, CreditCard, Pencil, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { getWorkers } from '@/app/actions/workers'
import { getCompanies } from '@/app/actions/companies'
import { getSession } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import ImportDialog from '@/components/import/ImportDialog'
import { WorkersCompanyFilter } from '@/components/workers/WorkersCompanyFilter'

export const dynamic = 'force-dynamic'

function WorkerRow({ worker }: { worker: any }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Link href={`/dashboard/workers/${worker.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{worker.firstName} {worker.lastName}</p>
            <Badge variant={worker.isActive ? 'default' : 'secondary'} className="text-xs">
              {worker.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {worker.cisStatus && (
              <Badge variant="outline" className="text-xs">CIS: {worker.cisStatus}</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            {worker.nationalInsurance && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="font-mono">{worker.nationalInsurance}</span>
              </div>
            )}
            {worker.jobDescription && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                <span className="truncate max-w-[140px]">{worker.jobDescription}</span>
              </div>
            )}
            {worker.email ? (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{worker.email}</span>
              </div>
            ) : (
              <span className="text-amber-500 font-medium">No email</span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="text-right">
          <p className="text-sm font-medium">{worker._count.payrollEntries} entries</p>
          <p className="text-xs text-muted-foreground">Added {formatDate(worker.createdAt)}</p>
        </div>
        <Link href={`/dashboard/workers/${worker.id}/edit`}>
          <Button variant="ghost" size="icon" title="Edit worker">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function SuspenseSection({ workers }: { workers: any[] }) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Suspense — {workers.length} worker{workers.length !== 1 ? 's' : ''} awaiting assignment
          </CardTitle>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          These workers were imported but could not be matched to a company. Click Edit to assign them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {workers.map(w => <WorkerRow key={w.id} worker={w} />)}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function WorkersPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>
}) {
  const { companyId: paramCompanyId } = await searchParams
  const session = await getSession()
  const isSuperAdmin = session?.role === 'SUPER_ADMIN'

  // URL param overrides session company (allows admin to switch)
  const effectiveCompanyId = paramCompanyId || session?.companyId

  // Super admins can switch company via dropdown; staff are locked to their company
  const companies = isSuperAdmin ? await getCompanies() : []
  const selectedCompany = effectiveCompanyId
    ? (companies.find(c => c.id === effectiveCompanyId) ?? { id: effectiveCompanyId, name: session?.companyId ? 'Your Company' : '' })
    : null

  // Always show Suspense workers so they can be reassigned
  const suspenseCompany = companies.find(c => c.name === 'Suspense')
  const suspenseWorkers = suspenseCompany && isSuperAdmin ? await getWorkers(suspenseCompany.id) : []

  // If no company context at all, prompt selection (but still show suspense)
  if (!effectiveCompanyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">Select a company to view its workers</p>
        </div>
        {suspenseWorkers.length > 0 && <SuspenseSection workers={suspenseWorkers} />}
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Select Company
            </CardTitle>
            <CardDescription>Choose a company to manage its workers</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkersCompanyFilter companies={companies} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const workers = await getWorkers(effectiveCompanyId)
  const activeWorkers = workers.filter(w => w.isActive).length
  const totalEntries = workers.reduce((sum, w) => sum + w._count.payrollEntries, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">
            {selectedCompany?.name ?? effectiveCompanyId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <WorkersCompanyFilter companies={companies} selectedId={effectiveCompanyId} />
          )}
          <ImportDialog entity="workers" />
          <Link href={`/dashboard/workers/new${effectiveCompanyId ? `?companyId=${effectiveCompanyId}` : ''}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">Registered workers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Entries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">Total entries</p>
          </CardContent>
        </Card>
      </div>

      {workers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Worker Directory</CardTitle>
            <CardDescription>No workers registered for this company yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No workers yet</p>
              <p className="text-sm mt-2">Add workers to start tracking payroll</p>
              <Link href={`/dashboard/workers/new${effectiveCompanyId ? `?companyId=${effectiveCompanyId}` : ''}`}>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Worker
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {suspenseWorkers.length > 0 && effectiveCompanyId !== suspenseCompany?.id && (
            <SuspenseSection workers={suspenseWorkers} />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Worker Directory</CardTitle>
              <CardDescription>{workers.length} registered workers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workers.map((worker) => (
                  <WorkerRow key={worker.id} worker={worker} />
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
