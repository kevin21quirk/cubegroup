'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, RefreshCw, Play } from 'lucide-react'

interface TestResult {
  ok: boolean
  stage?: string
  message?: string
  connectedEmail?: string
  monitorLabel?: string
  hasMonitorLabel?: boolean
  unreadInMonitor?: number
  unreadError?: string | null
}

interface PollResult {
  success: boolean
  message?: string
  error?: string
  summary?: {
    messagesFound: number
    messagesIngested: number
    messagesSkipped: number
    processingErrors: number
    errors: string[]
  }
}

export function GmailDiagnostics() {
  const [testing, setTesting]   = useState(false)
  const [polling, setPolling]   = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [pollResult, setPollResult] = useState<PollResult | null>(null)

  async function runTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res  = await fetch('/api/gmail/test')
      const data = await res.json()
      setTestResult(data)
    } catch (err: any) {
      setTestResult({ ok: false, message: err?.message ?? 'Fetch failed' })
    } finally {
      setTesting(false)
    }
  }

  async function runPoll() {
    setPolling(true)
    setPollResult(null)
    try {
      const res  = await fetch('/api/gmail/poll')
      const data = await res.json()
      setPollResult(data)
    } catch (err: any) {
      setPollResult({ success: false, error: err?.message ?? 'Fetch failed' })
    } finally {
      setPolling(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={runTest} disabled={testing || polling}>
          {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
          Test Connection
        </Button>
        <Button variant="outline" size="sm" onClick={runPoll} disabled={testing || polling}>
          {polling ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5" />}
          Poll Emails Now
        </Button>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`rounded-lg border p-3 text-sm space-y-2 ${testResult.ok ? 'border-green-200 bg-green-50 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:bg-red-950/30'}`}>
          <div className="flex items-center gap-2 font-medium">
            {testResult.ok
              ? <CheckCircle className="h-4 w-4 text-green-600" />
              : <XCircle className="h-4 w-4 text-red-500" />}
            {testResult.ok ? 'Gmail API connection OK' : 'Connection failed'}
          </div>
          {testResult.ok ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {testResult.connectedEmail && <p>Account: <strong className="text-foreground">{testResult.connectedEmail}</strong></p>}
              <p>
                Monitor label <code className="font-mono">{testResult.monitorLabel}</code>:{' '}
                {testResult.hasMonitorLabel
                  ? <Badge className="text-xs bg-green-100 text-green-700">Found</Badge>
                  : <Badge variant="destructive" className="text-xs">Not found in Gmail — create it</Badge>}
              </p>
              {testResult.unreadError
                ? <p className="text-red-600">Unread check error: {testResult.unreadError}</p>
                : <p>Unread messages waiting: <strong className="text-foreground">{testResult.unreadInMonitor}</strong></p>}
            </div>
          ) : (
            <p className="text-xs text-red-700 dark:text-red-400">{testResult.message}</p>
          )}
        </div>
      )}

      {/* Poll result */}
      {pollResult && (
        <div className={`rounded-lg border p-3 text-sm space-y-2 ${pollResult.success ? 'border-green-200 bg-green-50 dark:bg-green-950/30' : 'border-red-200 bg-red-50 dark:bg-red-950/30'}`}>
          <div className="flex items-center gap-2 font-medium">
            {pollResult.success
              ? <CheckCircle className="h-4 w-4 text-green-600" />
              : <XCircle className="h-4 w-4 text-red-500" />}
            {pollResult.success ? 'Poll completed' : 'Poll failed'}
          </div>
          {pollResult.success && pollResult.summary ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded border p-2 text-center">
                <p className="text-muted-foreground">Found</p>
                <p className="font-bold text-base">{pollResult.summary.messagesFound}</p>
              </div>
              <div className="rounded border p-2 text-center">
                <p className="text-muted-foreground">Ingested</p>
                <p className="font-bold text-base text-green-700">{pollResult.summary.messagesIngested}</p>
              </div>
              <div className="rounded border p-2 text-center">
                <p className="text-muted-foreground">Skipped</p>
                <p className="font-bold text-base">{pollResult.summary.messagesSkipped}</p>
              </div>
              <div className="rounded border p-2 text-center">
                <p className="text-muted-foreground">Errors</p>
                <p className={`font-bold text-base ${pollResult.summary.processingErrors > 0 ? 'text-red-600' : ''}`}>{pollResult.summary.processingErrors}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-700 dark:text-red-400">
              {pollResult.error || pollResult.message || 'Unknown error'}
            </p>
          )}
          {pollResult.summary?.errors?.length ? (
            <div className="text-xs text-red-600 space-y-0.5">
              {pollResult.summary.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
