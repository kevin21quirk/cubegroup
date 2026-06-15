/**
 * GET /api/gmail/poll
 * Session-protected manual trigger for the Gmail cron job.
 * Forwards to /api/cron/gmail with the correct CRON_SECRET header so
 * the dashboard "Poll Now" button works without exposing the secret.
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const baseUrl = env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  const cronUrl = `${baseUrl}/api/cron/gmail`

  const headers: HeadersInit = {}
  if (env.CRON_SECRET) {
    headers['Authorization'] = `Bearer ${env.CRON_SECRET}`
  }

  const res  = await fetch(cronUrl, { headers })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
