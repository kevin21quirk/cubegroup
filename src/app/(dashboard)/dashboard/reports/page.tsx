import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, TrendingUp, FileText } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View insights and generate reports
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue Report</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <CardDescription>Monthly revenue and profit analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View detailed revenue breakdown by company and period</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payroll Summary</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <CardDescription>Payroll processing statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Analyze payroll volumes, workers, and processing times</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Company Performance</CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <CardDescription>Client company metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Compare performance across different client companies</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Worker Analytics</CardTitle>
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <CardDescription>Contractor and worker insights</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Track worker hours, rates, and activity trends</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Invoice Report</CardTitle>
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <CardDescription>Invoice and payment tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monitor invoice status, payments, and outstanding amounts</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Custom Report</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
            <CardDescription>Build your own report</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create custom reports with specific metrics and filters</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Build Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Configure your database to enable detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Analytics Coming Soon</p>
            <p className="text-sm mt-2">Once you configure your database and add data, detailed reports will be available here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
