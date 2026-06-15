'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  action: () => Promise<{ success: boolean; sent: number; errors: string[]; error?: string }>
  umbrellaName: string | null
}

export function SendUmbrellaCSVButton({ action, umbrellaName }: Props) {
  const [status, setStatus]   = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [result, setResult]   = useState<{ sent: number; errors: string[] } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleClick() {
    setStatus('pending')
    const res = await action()
    if (res.success) {
      setStatus('done')
      setResult({ sent: res.sent, errors: res.errors })
    } else {
      setStatus('error')
      setErrorMsg(res.error ?? 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
          <CheckCircle2 className="h-4 w-4" />
          {result && result.sent > 0
            ? `Payroll CSV sent to ${umbrellaName ?? 'umbrella company'}`
            : 'No umbrella company configured — CSV not sent'}
        </div>
        {result && result.errors.length > 0 && (
          <p className="text-xs text-red-500">Errors: {result.errors.join('; ')}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={status === 'pending'}
      >
        {status === 'pending'
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          : <Send className="mr-2 h-4 w-4" />}
        {status === 'pending'
          ? 'Sending…'
          : `Send Payroll CSV${umbrellaName ? ` to ${umbrellaName}` : ''}`}
      </Button>
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errorMsg}
        </p>
      )}
    </div>
  )
}
