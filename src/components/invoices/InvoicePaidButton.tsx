'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  action: () => Promise<{ success: boolean; umbrellaSent: number; umbrellaErrors: string[]; error?: string }>
}

export function InvoicePaidButton({ action }: Props) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ umbrellaSent: number; umbrellaErrors: string[] } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleClick() {
    setStatus('pending')
    const res = await action()
    if (res.success) {
      setStatus('done')
      setResult({ umbrellaSent: res.umbrellaSent, umbrellaErrors: res.umbrellaErrors })
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
          Invoice marked as paid
        </div>
        {result && result.umbrellaSent > 0 && (
          <p className="text-xs text-green-600">
            Payroll spreadsheet sent to {result.umbrellaSent} umbrella company{result.umbrellaSent > 1 ? 'ies' : ''}
          </p>
        )}
        {result && result.umbrellaSent === 0 && result.umbrellaErrors.length === 0 && (
          <p className="text-xs text-muted-foreground">No umbrella company linked — spreadsheet not sent</p>
        )}
        {result && result.umbrellaErrors.length > 0 && (
          <p className="text-xs text-red-500">Spreadsheet errors: {result.umbrellaErrors.join('; ')}</p>
        )}
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
        {status === 'pending' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        {status === 'pending' ? 'Processing…' : 'Invoice Paid'}
      </Button>
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {errorMsg}
        </p>
      )}
    </div>
  )
}
