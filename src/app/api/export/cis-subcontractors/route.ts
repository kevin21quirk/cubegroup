import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSpreadsheetService } from '@/services/spreadsheet/SpreadsheetService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const subs = await prisma.cisSubcontractor.findMany({
    where: companyId ? { companyId, isActive: true } : { isActive: true },
    orderBy: { surname: 'asc' },
  })

  const svc = getSpreadsheetService()
  const csv = svc.generateCisSubcontractorCsv(subs)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="cis_subcontractor_import_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
