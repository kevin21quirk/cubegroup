import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getXeroService } from '@/services/accounting/XeroService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state') // companyId passed as state

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/companies?error=xero_auth_failed', req.url))
  }

  try {
    const xero = getXeroService()
    const { tenantId, refreshToken } = await xero.handleCallback(code)

    await prisma.company.update({
      where: { id: state },
      data: {
        xeroTenantId:    tenantId,
        xeroRefreshToken: refreshToken,
        accountingSystem: 'Xero',
      },
    })

    return NextResponse.redirect(new URL(`/dashboard/companies/${state}/edit?success=xero_connected`, req.url))
  } catch (error) {
    console.error('Xero callback error:', error)
    return NextResponse.redirect(new URL(`/dashboard/companies/${state}/edit?error=xero_auth_failed`, req.url))
  }
}
