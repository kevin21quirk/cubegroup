import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, FileText, CheckSquare, Receipt, DollarSign, ArrowRight, Clock } from 'lucide-react'

interface WorkflowStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'in_progress' | 'pending'
  count?: number
}

interface WorkflowVisualizationProps {
  companyName?: string
  steps: WorkflowStep[]
}

export function WorkflowVisualization({ companyName, steps }: WorkflowVisualizationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Workflow</CardTitle>
        <CardDescription>
          {companyName ? `${companyName} - ` : ''}Email → Timesheet → Validation → Invoice → Payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Step Card */}
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  step.status === 'completed' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                    : step.status === 'in_progress'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 animate-pulse'
                    : 'border-gray-300 bg-gray-50 dark:bg-gray-900'
                }`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 rounded-full ${
                      step.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900'
                        : step.status === 'in_progress'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    </div>
                    {step.count !== undefined && (
                      <Badge variant={step.status === 'completed' ? 'default' : 'secondary'}>
                        {step.count} items
                      </Badge>
                    )}
                    <Badge variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {step.status === 'completed' ? '✓ Complete' :
                       step.status === 'in_progress' ? '⟳ In Progress' : '○ Pending'}
                    </Badge>
                  </div>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight className={`h-6 w-6 ${
                      step.status === 'completed' ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="mt-8 pt-8 border-t">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Process Timeline
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Completed steps are processed and ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">In progress steps are currently being worked on</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="text-muted-foreground">Pending steps are waiting for previous steps</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Default workflow steps
export function getDefaultWorkflowSteps() {
  return [
    {
      id: 'email',
      title: 'Email Received',
      description: 'Timesheet email arrives',
      icon: <Mail className="h-5 w-5" />,
      status: 'pending' as const,
      count: 0,
    },
    {
      id: 'timesheet',
      title: 'Timesheet Processed',
      description: 'Workers & hours extracted',
      icon: <FileText className="h-5 w-5" />,
      status: 'pending' as const,
      count: 0,
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'Data verified',
      icon: <CheckSquare className="h-5 w-5" />,
      status: 'pending' as const,
      count: 0,
    },
    {
      id: 'invoice',
      title: 'Invoice Generated',
      description: 'Client invoice created',
      icon: <Receipt className="h-5 w-5" />,
      status: 'pending' as const,
      count: 0,
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Invoice paid',
      icon: <DollarSign className="h-5 w-5" />,
      status: 'pending' as const,
      count: 0,
    },
  ]
}
