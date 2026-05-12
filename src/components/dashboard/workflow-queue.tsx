"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function WorkflowQueue() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Queue</CardTitle>
        <CardDescription>Current status of payroll submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>No workflow data yet</p>
          <p className="text-sm mt-2">Configure your database to start tracking workflows</p>
        </div>
      </CardContent>
    </Card>
  )
}
