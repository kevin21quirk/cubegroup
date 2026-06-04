'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function EmailRetryButton({ emailId }: { emailId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRetry() {
    setLoading(true)
    try {
      const res = await fetch(`/api/emails/${emailId}/retry`, { method: 'POST' })
      setDone(true)
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-orange-600 hover:text-orange-700"
      onClick={handleRetry}
      disabled={loading || done}
      title="Retry processing"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  )
}
