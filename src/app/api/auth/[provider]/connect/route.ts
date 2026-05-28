import { NextRequest, NextResponse } from 'next/server'
import { getXeroService } from '@/services/accounting/XeroService'
import { getQuickBooksService } from '@/services/accounting/QuickBooksService'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    let authUrl: string

    if (provider === 'xero') {
      authUrl = getXeroService().getAuthUrl(companyId)
    } else if (provider === 'quickbooks') {
      authUrl = getQuickBooksService().getAuthUrl(companyId)
    } else {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 })
    }

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error(`${provider} connect error:`, error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}
