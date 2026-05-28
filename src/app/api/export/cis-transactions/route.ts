import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSpreadsheetService } from '@/services/spreadsheet/SpreadsheetService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const payrollSubmissionId = searchParams.get('payrollSubmissionId')
  const companyId = searchParams.get('companyId')

  const transactions = await prisma.cisTransaction.findMany({
    where: {
      ...(payrollSubmissionId ? { payrollSubmissionId } : {}),
      ...(companyId ? {
        OR: [
          { worker: { companyId } },
          { cisSubcontractor: { companyId } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  const svc = getSpreadsheetService()
  const csv = svc.generateCisTransactionCsv(transactions)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="cis_transaction_import_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
