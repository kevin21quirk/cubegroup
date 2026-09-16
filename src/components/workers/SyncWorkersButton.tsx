'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { syncWorkersFromPayroll } from '@/app/actions/workers'

export function SyncWorkersButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleSync() {
    startTransition(async () => {
      const { synced } = await syncWorkersFromPayroll()
      setResult(synced > 0 ? `${synced} worker${synced !== 1 ? 's' : ''} added to Suspense` : 'All workers already synced')
      setTimeout(() => setResult(null), 4000)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleSync} disabled={isPending}>
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Syncing…' : 'Sync from Payroll'}
      </Button>
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
    </div>
  )
}
