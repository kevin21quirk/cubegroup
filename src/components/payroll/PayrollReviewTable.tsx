'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, Send, Save, Loader2, AlertCircle, Mail, MailX } from 'lucide-react'
import { saveBulkTaxRates, approveAllEntries, sendPayslipsForSubmission } from '@/app/actions/payroll'

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
  netToWorker: number
  payslipStatus: string
  payslipSentAt: Date | null
  worker: { email: string | null } | null
}

interface PayrollReviewTableProps {
  submissionId: string
  entries: Entry[]
}

function fmt(n: number) {
  return `£${n.toFixed(2)}`
}

export function PayrollReviewTable({ submissionId, entries: initial }: PayrollReviewTableProps) {
  const [entries, setEntries] = useState(initial)
  const [taxRates, setTaxRates] = useState<Record<string, number>>(
    Object.fromEntries(initial.map(e => [e.id, e.taxRate ?? 20]))
  )
  const [sendResults, setSendResults] = useState<{ name: string; status: string; error?: string }[] | null>(null)
  const [isPending, startTransition] = useTransition()

  function gross(e: Entry) { return e.grossPay || e.totalGrossPay }
  function computedTax(e: Entry) { return parseFloat(((gross(e) * (taxRates[e.id] ?? 20)) / 100).toFixed(2)) }
  function computedNet(e: Entry) { return parseFloat((gross(e) - computedTax(e)).toFixed(2)) }

  const totalGross = entries.reduce((s, e) => s + gross(e), 0)
  const totalTax   = entries.reduce((s, e) => s + computedTax(e), 0)
  const totalNet   = entries.reduce((s, e) => s + computedNet(e), 0)

  function handleRateChange(id: string, val: string) {
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0 && n <= 100) setTaxRates(r => ({ ...r, [id]: n }))
  }

  function handleSave() {
    startTransition(async () => {
      const updates = entries.map(e => ({ id: e.id, taxRate: taxRates[e.id] ?? 20 }))
      await saveBulkTaxRates(updates)
      setEntries(prev => prev.map(e => ({ ...e, taxRate: taxRates[e.id] ?? e.taxRate })))
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
        const r = results.find(r => {
          const name = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
          return r.name === name
        })
        return r?.status === 'sent' ? { ...e, payslipStatus: 'SENT' } : e
      }))
    })
  }

  const allApproved = entries.every(e => e.payslipStatus !== 'PENDING')
  const anySent = entries.some(e => e.payslipStatus === 'SENT')

  return (
    <div className="space-y-4">
      {/* Totals bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Gross', value: totalGross, cls: '' },
          { label: 'Total Tax', value: totalTax, cls: 'text-red-600' },
          { label: 'Total Net', value: totalNet, cls: 'text-green-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-muted rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${cls}`}>{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3">Worker</th>
              <th className="text-right px-4 py-3">Hours</th>
              <th className="text-right px-4 py-3">Gross</th>
              <th className="text-center px-4 py-3 w-28">Tax %</th>
              <th className="text-right px-4 py-3">Tax</th>
              <th className="text-right px-4 py-3 font-semibold">Net</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map(e => {
              const name = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
              const email = e.worker?.email
              return (
                <tr key={e.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{name}</div>
                    {email
                      ? <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3"/>{email}</div>
                      : <div className="flex items-center gap-1 text-xs text-amber-600"><MailX className="h-3 w-3"/>No email</div>
                    }
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {e.hoursWorked > 0 ? e.hoursWorked : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmt(gross(e))}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={taxRates[e.id] ?? 20}
                        onChange={ev => handleRateChange(e.id, ev.target.value)}
                        className="w-16 h-8 text-center text-sm"
                        disabled={isPending}
                      />
                      <span className="text-muted-foreground text-xs">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">-{fmt(computedTax(e))}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-green-600">{fmt(computedNet(e))}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={e.payslipStatus === 'SENT' ? 'default' : e.payslipStatus === 'APPROVED' ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {e.payslipStatus}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted font-semibold">
            <tr>
              <td className="px-4 py-3" colSpan={2}>Totals</td>
              <td className="px-4 py-3 text-right tabular-nums">{fmt(totalGross)}</td>
              <td />
              <td className="px-4 py-3 text-right tabular-nums text-red-600">-{fmt(totalTax)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-green-600">{fmt(totalNet)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={handleSave} disabled={isPending} variant="outline" size="sm">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Tax Rates
        </Button>
        <Button onClick={handleApprove} disabled={isPending || allApproved} variant="outline" size="sm">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve All
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
