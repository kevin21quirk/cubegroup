"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function RecentSubmissions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Submissions</CardTitle>
        <CardDescription>Latest payroll submissions from companies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No payroll submissions yet</p>
          <p className="text-sm mt-2">Configure your database to start tracking submissions</p>
        </div>
      </CardContent>
    </Card>
  )
}
