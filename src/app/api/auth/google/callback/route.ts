/**
 * GET /api/auth/google/callback
 * Handles the OAuth2 redirect from Google.
 * Exchanges the code for tokens and stores the refresh token in DB.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getGmailService } from '@/services/email/GmailService'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  const baseUrl = env.NEXT_PUBLIC_APP_URL

  // User denied access
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?error=google_auth_denied&detail=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?error=google_no_code`
    )
  }

  try {
    const gmailService = getGmailService()
    const { email } = await gmailService.exchangeCode(code)

    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?success=google_connected&email=${encodeURIComponent(email)}`
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token exchange failed'
    console.error('[Google OAuth callback]', message)
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings?error=google_token_exchange&detail=${encodeURIComponent(message)}`
    )
  }
}
