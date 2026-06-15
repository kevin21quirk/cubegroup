import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertCircle, Clock, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function DashboardStats() {
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []
  const subFilter  = isStaff && assignedIds.length > 0 ? { companyId: { in: assignedIds } } : {}
  const invFilter  = isStaff && assignedIds.length > 0 ? { companyId: { in: assignedIds } } : {}

  const [totalSubmissions, pendingValidation, awaitingPayment, unpaidAggregate] = await Promise.all([
    prisma.payrollSubmission.count({ where: subFilter }),
    prisma.payrollSubmission.count({
      where: { ...subFilter, workflowState: { in: ['VALIDATION_FAILED', 'AWAITING_REVIEW'] } },
    }),
    prisma.invoice.count({
      where: { ...invFilter, paymentStatus: 'UNPAID' },
    }),
    prisma.invoice.aggregate({
      where: { ...invFilter, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
      _sum: { totalAmount: true },
    }),
  ])

  const unpaidAmount = unpaidAggregate._sum.totalAmount ?? 0

  const stats = [
    {
      name: 'Total Submissions',
      value: totalSubmissions.toString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      name: 'Pending Validation',
      value: pendingValidation.toString(),
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      name: 'Awaiting Payment',
      value: awaitingPayment.toString(),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
    },
    {
      name: 'Unpaid Amount',
      value: formatCurrency(unpaidAmount),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.name}
            </CardTitle>
            <div className={`rounded-full p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
