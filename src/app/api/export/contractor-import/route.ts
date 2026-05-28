import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSpreadsheetService } from '@/services/spreadsheet/SpreadsheetService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const workers = await prisma.worker.findMany({
    where: companyId ? { companyId, isActive: true } : { isActive: true },
    orderBy: { lastName: 'asc' },
  })

  const svc = getSpreadsheetService()
  const csv = svc.generateContractorImportCsv(workers)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contractor_import_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
