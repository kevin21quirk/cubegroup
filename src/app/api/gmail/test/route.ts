/**
 * GET /api/gmail/test
 * Tests whether the stored OAuth token can actually reach the Gmail API.
 * Returns diagnostic info: connected email, label list, unread count.
 * Protected by dashboard session (must be logged in).
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getGmailService } from '@/services/email/GmailService'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const gmailService = getGmailService()

  try {
    // 1. Check token exists in DB
    const connected = await gmailService.isConnected()
    if (!connected) {
      return NextResponse.json({
        ok: false,
        stage: 'token_missing',
        message: 'No OAuth refresh token stored. Go to Settings → Connect Gmail Account.',
      })
    }

    // 2. Try to get an actual Gmail client (this will fail if token is revoked)
    const gmail = await gmailService.getGmailClient()

    // 3. Fetch label list — cheapest real API call
    const labelsRes = await gmail.users.labels.list({ userId: 'me' })
    const labels = labelsRes.data.labels?.map(l => l.name) ?? []

    // 4. Check the monitor label exists
    const monitorLabel   = env.GMAIL_MONITOR_LABEL
    const processedLabel = env.GMAIL_PROCESSED_LABEL
    const hasMonitor     = labels.some(l => l === monitorLabel)
    const hasProcessed   = labels.some(l => l === processedLabel)

    // 5. Count unread messages in monitor label
    let unreadCount = 0
    let unreadError: string | null = null
    try {
      const ids = await gmailService.fetchUnreadMessageIds(monitorLabel)
      unreadCount = ids.length
    } catch (err: any) {
      unreadError = err?.message ?? 'Failed to fetch unread messages'
    }

    // 6. Get connected email
    const connectedEmail = await gmailService.getConnectedEmail()

    return NextResponse.json({
      ok: true,
      connectedEmail,
      monitorLabel,
      processedLabel,
      hasMonitorLabel:   hasMonitor,
      hasProcessedLabel: hasProcessed,
      unreadInMonitor:   unreadCount,
      unreadError,
      labelCount: labels.length,
    })
  } catch (err: any) {
    const message = err?.message ?? 'Unknown error'
    const isRevoked = message.includes('invalid_grant') || message.includes('Token has been expired')
    return NextResponse.json({
      ok: false,
      stage: isRevoked ? 'token_revoked' : 'api_error',
      message: isRevoked
        ? 'OAuth token has been revoked or expired. Go to Settings → Reconnect Gmail Account.'
        : message,
      raw: message,
    })
  }
}
