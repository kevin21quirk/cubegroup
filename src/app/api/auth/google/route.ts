/**
 * GET /api/auth/google
 * Initiates the Gmail OAuth2 flow.
 * Redirects the admin browser to Google's consent page.
 */
import { NextResponse } from 'next/server'
import { getGmailService } from '@/services/email/GmailService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const gmailService = getGmailService()
    const authUrl = gmailService.getAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate auth URL'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
