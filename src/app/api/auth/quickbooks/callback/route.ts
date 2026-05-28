import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getQuickBooksService } from '@/services/accounting/QuickBooksService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') // companyId passed as state

  if (!state) {
    return NextResponse.redirect(new URL('/dashboard/companies?error=qb_auth_failed', req.url))
  }

  try {
    const qb = getQuickBooksService()
    const { realmId, refreshToken } = await qb.handleCallback(req.url)

    await prisma.company.update({
      where: { id: state },
      data: {
        quickbooksRealmId:     realmId,
        quickbooksRefreshToken: refreshToken,
        accountingSystem:       'QuickBooks',
      },
    })

    return NextResponse.redirect(new URL(`/dashboard/companies/${state}/edit?success=qb_connected`, req.url))
  } catch (error) {
    console.error('QuickBooks callback error:', error)
    return NextResponse.redirect(new URL(`/dashboard/companies/${state}/edit?error=qb_auth_failed`, req.url))
  }
}
