'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  action: () => Promise<{ success: boolean; error?: string }>
}

export function InvoicePaidButton({ action }: Props) {
  const [status, setStatus]   = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleClick() {
    setStatus('pending')
    const res = await action()
    if (res.success) {
      setStatus('done')
    } else {
      setStatus('error')
      setErrorMsg(res.error ?? 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
        <CheckCircle2 className="h-4 w-4" />
        Invoice marked as paid
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        className="bg-green-600 hover:bg-green-700"
        onClick={handleClick}
        disabled={status === 'pending'}
      >
        {status === 'pending'
          ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          : <CheckCircle className="mr-2 h-4 w-4" />}
        {status === 'pending' ? 'Processing…' : 'Mark as Paid'}
      </Button>
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errorMsg}
        </p>
      )}
    </div>
  )
}
