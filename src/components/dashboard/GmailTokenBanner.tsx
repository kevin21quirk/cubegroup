'use client'

import Link from 'next/link'
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

interface Props {
  daysOld: number
  connectedEmail: string | null
}

export function GmailTokenBanner({ daysOld, connectedEmail }: Props) {
  const isExpired = daysOld >= 7
  const isUrgent  = daysOld >= 5

  if (!isUrgent) return null

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
      isExpired
        ? 'bg-red-600 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        {isExpired
          ? <XCircle className="h-4 w-4 shrink-0" />
          : <AlertTriangle className="h-4 w-4 shrink-0" />}
        <span>
          {isExpired
            ? <>Gmail token has <strong>expired</strong> — emails are no longer being picked up{connectedEmail ? ` (${connectedEmail})` : ''}.</>
            : <>Gmail token expires in <strong>{7 - daysOld} day{7 - daysOld !== 1 ? 's' : ''}</strong> — reconnect soon to keep email processing running{connectedEmail ? ` (${connectedEmail})` : ''}.</>}
        </span>
      </div>
      <Link
        href="/api/auth/google"
        className="flex items-center gap-1.5 rounded-md border border-white/40 bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors whitespace-nowrap"
      >
        <RefreshCw className="h-3 w-3" />
        Reconnect Gmail
      </Link>
    </div>
  )
}
