import { Suspense } from 'react'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentSubmissions } from '@/components/dashboard/recent-submissions'
import { WorkflowQueue } from '@/components/dashboard/workflow-queue'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { Card, CardContent } from '@/components/ui/card'

function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Cube Group Payroll Automation Platform
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <LoadingCard key={i} />)}</div>}>
        <DashboardStats />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart />
        <Suspense fallback={<LoadingCard />}>
          <WorkflowQueue />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingCard />}>
        <RecentSubmissions />
      </Suspense>
    </div>
  )
}
