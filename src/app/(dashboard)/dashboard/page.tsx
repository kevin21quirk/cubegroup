import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentSubmissions } from '@/components/dashboard/recent-submissions'
import { WorkflowQueue } from '@/components/dashboard/workflow-queue'
import { RevenueChart } from '@/components/dashboard/revenue-chart'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Cube Group Payroll Automation Platform
        </p>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart />
        <WorkflowQueue />
      </div>

      <RecentSubmissions />
    </div>
  )
}
