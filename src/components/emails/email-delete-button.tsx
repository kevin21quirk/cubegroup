'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function EmailDeleteButton({ emailId }: { emailId: string }) {
  const [loading,  setLoading]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)  // auto-cancel after 3s
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/emails/${emailId}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Delete failed')
      }
    } finally {
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 px-2 transition-colors ${
        confirm
          ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
          : 'text-muted-foreground hover:text-red-600'
      }`}
      onClick={handleDelete}
      disabled={loading}
      title={confirm ? 'Click again to confirm delete' : 'Delete email record'}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : confirm ? (
        <span className="text-xs font-medium">Confirm?</span>
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
