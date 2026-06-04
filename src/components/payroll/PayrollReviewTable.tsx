'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Send, Save, Loader2, AlertCircle, Mail, MailX, RefreshCw } from 'lucide-react'
import { saveBulkEntryRates, approveAllEntries, sendPayslipsForSubmission } from '@/app/actions/payroll'

interface Entry {
  id: string
  workerName: string
  firstName: string | null
  lastName: string | null
  payrollWeek: string
  grossPay: number
  totalGrossPay: number
  hoursWorked: number
  hourlyRate: number
  taxRate: number
  taxAmount: number
  feeRate: number
  feeAmount: number
  umbrellaSharePct: number
  brokerSharePct: number
  umbrellaShareAmount: number
  brokerShareAmount: number
  netToWorker: number
  payslipStatus: string
  payslipSentAt: Date | null
  worker: { email: string | null } | null
}

interface Rates {
  taxRate: number
  feeAmount: number
  umbrellaSharePct: number
  brokerSharePct: number
}

interface PayrollReviewTableProps {
  submissionId: string
  entries: Entry[]
}

function fmt(n: number) { return `£${n.toFixed(2)}` }
function pct(n: number) { return `${n.toFixed(1)}%` }

function calc(gross: number, r: Rates) {
  const tax      = parseFloat(((gross * r.taxRate) / 100).toFixed(2))
  const fee      = parseFloat(r.feeAmount.toFixed(2))
  const umbrella = parseFloat(((fee * r.umbrellaSharePct) / 100).toFixed(2))
  const broker   = parseFloat(((fee * r.brokerSharePct)   / 100).toFixed(2))
  const net      = parseFloat((gross - tax - fee).toFixed(2))
  return { tax, fee, umbrella, broker, net }
}

function NumInput({ value, onChange, min = 0, max = 100, step = 0.5, disabled = false, className = '', prefix = '', suffix = '%' }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; disabled?: boolean; className?: string; prefix?: string; suffix?: string
}) {
  return (
    <div className="flex items-center gap-0.5">
      {prefix && <span className="text-muted-foreground text-xs">{prefix}</span>}
      <Input
        type="number" min={min} max={max} step={step}
        value={value}
        onChange={e => { const n = parseFloat(e.target.value); if (!isNaN(n) && n >= min) onChange(n) }}
        className={`h-8 text-center text-sm ${className}`}
        disabled={disabled}
      />
      {suffix && <span className="text-muted-foreground text-xs">{suffix}</span>}
    </div>
  )
}

export function PayrollReviewTable({ submissionId, entries: initial }: PayrollReviewTableProps) {
  const [entries, setEntries] = useState(initial)
  const [rates, setRates] = useState<Record<string, Rates>>(
    Object.fromEntries(initial.map(e => [e.id, {
      taxRate: e.taxRate ?? 20,
      feeAmount: e.feeAmount ?? 0,
      umbrellaSharePct: e.umbrellaSharePct ?? 50,
      brokerSharePct: e.brokerSharePct ?? 50,
    }]))
  )
  // Global defaults panel
  const [global, setGlobal] = useState<Rates>({ taxRate: 20, feeAmount: 0, umbrellaSharePct: 50, brokerSharePct: 50 })
  const [sendResults, setSendResults] = useState<{ name: string; status: string; error?: string }[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function gr(e: Entry) { return e.grossPay || e.totalGrossPay }
  function r(id: string): Rates { return rates[id] ?? global }

  function applyGlobal() {
    setRates(prev => Object.fromEntries(Object.keys(prev).map(id => [id, { ...global }])))
  }

  function setRate(id: string, field: keyof Rates, val: number) {
    setRates(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }))
  }

  const totals = entries.reduce((acc, e) => {
    const g = gr(e); const c = calc(g, r(e.id))
    return { gross: acc.gross + g, tax: acc.tax + c.tax, fee: acc.fee + c.fee, net: acc.net + c.net, umbrella: acc.umbrella + c.umbrella, broker: acc.broker + c.broker }
  }, { gross: 0, tax: 0, fee: 0, net: 0, umbrella: 0, broker: 0 })


  function handleSave() {
    startTransition(async () => {
      const updates = entries.map(e => {
        const er = r(e.id)
        return { id: e.id, taxRate: er.taxRate, feeAmount: er.feeAmount, umbrellaSharePct: er.umbrellaSharePct, brokerSharePct: er.brokerSharePct }
      })
      await saveBulkEntryRates(updates)
    })
  }

  function handleApprove() {
    startTransition(async () => {
      await approveAllEntries(submissionId)
      setEntries(prev => prev.map(e => ({ ...e, payslipStatus: 'APPROVED' })))
    })
  }

  function handleSendAll() {
    startTransition(async () => {
      const results = await sendPayslipsForSubmission(submissionId)
      setSendResults(results)
      setEntries(prev => prev.map(e => {
        const name = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
        const r = results.find(r => r.name === name)
        return r?.status === 'sent' ? { ...e, payslipStatus: 'SENT' } : e
      }))
    })
  }

  const allApproved = entries.every(e => e.payslipStatus !== 'PENDING')
  const anySent = entries.some(e => e.payslipStatus === 'SENT')

  return (
    <div className="space-y-5">

      {/* Global defaults */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Default Tax %</p>
            <NumInput value={global.taxRate} onChange={v => setGlobal(g => ({ ...g, taxRate: v }))} className="w-16" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Fee per payslip (£)</p>
            <NumInput value={global.feeAmount} onChange={v => setGlobal(g => ({ ...g, feeAmount: v }))} min={0} max={99999} step={1} prefix="£" suffix="" className="w-20" />
          </div>
          <div className="border-l pl-4">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Fee split — Umbrella %</p>
            <NumInput value={global.umbrellaSharePct} onChange={v => setGlobal(g => ({ ...g, umbrellaSharePct: v, brokerSharePct: parseFloat((100 - v).toFixed(1)) }))} className="w-16" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Broker %</p>
            <NumInput value={global.brokerSharePct} onChange={v => setGlobal(g => ({ ...g, brokerSharePct: v, umbrellaSharePct: parseFloat((100 - v).toFixed(1)) }))} className="w-16" />
          </div>
          <Button variant="outline" size="sm" onClick={applyGlobal} disabled={isPending}>
            <RefreshCw className="mr-2 h-3 w-3" />Apply to all
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Fee is a fixed £ amount deducted per payslip: <strong>Net = Gross − Tax − Fee</strong>. Umbrella % + Broker % must total 100%.</p>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Gross', value: totals.gross, cls: '' },
          { label: 'Total Tax',   value: totals.tax,   cls: 'text-red-600' },
          { label: 'Total Fee',   value: totals.fee,   cls: 'text-orange-600' },
          { label: 'Net to Workers', value: totals.net, cls: 'text-green-600' },
          { label: 'Umbrella Share', value: totals.umbrella, cls: 'text-blue-600' },
          { label: 'Broker Share',   value: totals.broker,   cls: 'text-purple-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-muted rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-lg font-bold ${cls}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Per-worker table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-3 py-2.5">Worker</th>
              <th className="text-right px-3 py-2.5">Gross</th>
              <th className="text-center px-3 py-2.5">Tax %</th>
              <th className="text-right px-3 py-2.5">Tax</th>
              <th className="text-right px-3 py-2.5">Fee £</th>
              <th className="text-center px-3 py-2.5 text-blue-700">Umb %</th>
              <th className="text-right px-3 py-2.5 text-blue-700">Umb £</th>
              <th className="text-center px-3 py-2.5 text-purple-700">Broker %</th>
              <th className="text-right px-3 py-2.5 text-purple-700">Broker £</th>
              <th className="text-right px-3 py-2.5 font-semibold">Net</th>
              <th className="text-center px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map(e => {
              const name  = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
              const email = e.worker?.email
              const g     = gr(e)
              const er    = r(e.id)
              const c     = calc(g, er)
              return (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{name}</div>
                    {email
                      ? <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3"/>{email}</div>
                      : <div className="flex items-center gap-1 text-xs text-amber-600"><MailX className="h-3 w-3"/>No email</div>
                    }
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{fmt(g)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <NumInput value={er.taxRate} onChange={v => setRate(e.id, 'taxRate', v)} disabled={isPending} className="w-14" />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-red-600">-{fmt(c.tax)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <NumInput value={er.feeAmount} onChange={v => setRate(e.id, 'feeAmount', v)} min={0} max={99999} step={1} prefix="£" suffix="" disabled={isPending} className="w-16" />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <NumInput value={er.umbrellaSharePct}
                      onChange={v => { setRate(e.id, 'umbrellaSharePct', v); setRate(e.id, 'brokerSharePct', parseFloat((100 - v).toFixed(1))) }}
                      disabled={isPending} className="w-14" />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">{fmt(c.umbrella)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <NumInput value={er.brokerSharePct}
                      onChange={v => { setRate(e.id, 'brokerSharePct', v); setRate(e.id, 'umbrellaSharePct', parseFloat((100 - v).toFixed(1))) }}
                      disabled={isPending} className="w-14" />
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-purple-600">{fmt(c.broker)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-green-600">{fmt(c.net)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant={e.payslipStatus === 'SENT' ? 'default' : e.payslipStatus === 'APPROVED' ? 'outline' : 'secondary'} className="text-xs">
                      {e.payslipStatus}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted font-semibold text-sm">
            <tr>
              <td className="px-3 py-2.5">Totals</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{fmt(totals.gross)}</td>
              <td />
              <td className="px-3 py-2.5 text-right tabular-nums text-red-600">-{fmt(totals.tax)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-orange-600">-{fmt(totals.fee)}</td>
              <td />
              <td className="px-3 py-2.5 text-right tabular-nums text-blue-600">{fmt(totals.umbrella)}</td>
              <td />
              <td className="px-3 py-2.5 text-right tabular-nums text-purple-600">{fmt(totals.broker)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-green-600">{fmt(totals.net)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={handleSave} disabled={isPending} variant="outline" size="sm">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Rates
        </Button>
        <Button onClick={handleApprove} disabled={isPending || allApproved} variant="outline" size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />Approve All
        </Button>
        <Button onClick={handleSendAll} disabled={isPending} size="sm">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send All Payslips
        </Button>
        {anySent && <span className="text-sm text-green-600 font-medium">✓ Payslips sent</span>}
      </div>

      {/* Send results */}
      {sendResults && (
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-sm font-medium mb-2">Send results:</p>
          {sendResults.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {r.status === 'sent'
                ? <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                : <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />}
              <span className="font-medium">{r.name}</span>
              <span className="text-muted-foreground">
                {r.status === 'sent' ? 'Sent' : r.status === 'no_email' ? 'No email address' : `Error: ${r.error}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
