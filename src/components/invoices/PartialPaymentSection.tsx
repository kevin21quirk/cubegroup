'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PoundSterling, Plus, Trash2, Loader2, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from 'lucide-react'

interface PaymentRow {
  id: string
  amount: number
  paymentDate: Date | string
  paymentMethod: string | null
  reference: string | null
  notes: string | null
}

interface Props {
  invoiceId: string
  totalAmount: number
  paidAmount: number
  paymentStatus: string
  payments: PaymentRow[]
  recordAction: (formData: FormData) => Promise<void>
  deleteAction: (paymentId: string, invoiceId: string) => Promise<void>
  // Payroll company side
  umbrellaTotal: number
  umbrellaName: string | null
  umbrellaCsvSent: boolean
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PartialPaymentSection({
  invoiceId, totalAmount, paidAmount, paymentStatus, payments: initialPayments,
  recordAction, deleteAction,
  umbrellaTotal, umbrellaName, umbrellaCsvSent,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // Use actual paid amount from payments array if paidAmount looks stale
  const computedPaid = initialPayments.reduce((s, p) => s + p.amount, 0)
  const paid         = Math.max(paidAmount, computedPaid)
  const outstanding  = Math.max(0, totalAmount - paid)
  const isFullyPaid  = paymentStatus === 'PAID' || outstanding < 0.01
  const cubeMargin   = totalAmount - umbrellaTotal

  const statusVariant = isFullyPaid ? 'default' : paymentStatus === 'PARTIAL' ? 'secondary' : 'outline'
  const statusLabel   = isFullyPaid ? 'Fully Paid' : paymentStatus === 'PARTIAL' ? 'Part Paid' : 'Unpaid'

  async function handleRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await recordAction(new FormData(e.currentTarget))
      window.location.reload()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record payment')
      setSaving(false)
    }
  }

  async function handleDelete(paymentId: string) {
    setDeleting(paymentId)
    try {
      await deleteAction(paymentId, invoiceId)
      window.location.reload()
    } catch {
      setDeleting(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5" />
            Payment Reconciliation
          </CardTitle>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Two-column reconciliation ── */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Left: what Cube receives from the client company */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" /> Received from Client
            </p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-semibold">{fmt(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-green-700">{fmt(paid)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">Outstanding</span>
                <span className={`font-bold ${outstanding > 0.01 ? 'text-amber-600' : 'text-green-600'}`}>
                  {outstanding > 0.01 ? fmt(outstanding) : '—'}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            {totalAmount > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (paid / totalAmount) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Right: what goes to the payroll company */}
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-500" /> Payroll Company Payout
            </p>
            {umbrellaTotal > 0 ? (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{umbrellaName ?? 'Payroll Company'}</span>
                  <span className="font-semibold text-blue-700">{fmt(umbrellaTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CSV Sent</span>
                  <Badge variant={umbrellaCsvSent ? 'default' : 'outline'} className="text-xs">
                    {umbrellaCsvSent ? 'Sent' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Cube Margin
                  </span>
                  <span className="font-bold text-primary">{fmt(cubeMargin)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No umbrella company linked to this submission.</p>
            )}
          </div>
        </div>

        {/* ── Payment history ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment History</p>
          {initialPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Date</th>
                    <th className="text-left px-3 py-2 font-medium">Method</th>
                    <th className="text-left px-3 py-2 font-medium">Reference</th>
                    <th className="text-right px-3 py-2 font-medium">Amount</th>
                    <th className="w-8 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {initialPayments.map(p => (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="px-3 py-2">{fmtDate(p.paymentDate)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.paymentMethod || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.reference || '—'}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-700">{fmt(p.amount)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          {deleting === p.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Record payment form ── */}
        {!isFullyPaid && (
          !showForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-3.5 w-3.5" /> Record Part Payment
            </Button>
          ) : (
            <form onSubmit={handleRecord} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <input type="hidden" name="invoiceId" value={invoiceId} />
              <p className="text-sm font-medium">Record a Payment</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Amount (£) *</label>
                  <Input name="amount" type="number" step="0.01" min="0.01"
                    max={outstanding} defaultValue={outstanding.toFixed(2)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Payment Date</label>
                  <Input name="paymentDate" type="date"
                    defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Method</label>
                  <select name="paymentMethod"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">— Select —</option>
                    <option>Bank Transfer</option>
                    <option>BACS</option>
                    <option>Cheque</option>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Direct Debit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Reference</label>
                  <Input name="reference" placeholder="e.g. TRN-12345" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <Input name="notes" placeholder="Optional notes" />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Save Payment
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )
        )}
      </CardContent>
    </Card>
  )
}
