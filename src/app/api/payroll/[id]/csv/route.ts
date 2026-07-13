import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { UmbrellaPayrollService } from '@/services/umbrella/UmbrellaPayrollService'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  try {
    const svc = new UmbrellaPayrollService()
    const { filename, csv } = await svc.getCsvForDownload(id)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to generate CSV' },
      { status: 500 },
    )
  }
}
