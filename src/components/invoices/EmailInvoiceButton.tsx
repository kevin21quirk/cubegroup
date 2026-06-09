'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  action: () => Promise<{ sent: boolean; to?: string; error?: string }>
  invoiceEmail: string | null
}

export function EmailInvoiceButton({ action, invoiceEmail }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleClick() {
    setStatus('sending')
    setMessage(null)
    const result = await action()
    if (result.sent) {
      setStatus('sent')
      setMessage(`Sent to ${result.to}`)
    } else {
      setStatus('error')
      setMessage(result.error ?? 'Failed to send')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={status === 'sending'}
        title={!invoiceEmail ? 'No invoice email set – add one in Company Settings' : undefined}
      >
        {status === 'sending' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : status === 'sent' ? (
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
        ) : status === 'error' ? (
          <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent' : 'Email Invoice'}
      </Button>
      {message && (
        <p className={`text-xs ${status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
