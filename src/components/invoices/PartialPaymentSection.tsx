'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PoundSterling, Plus, Trash2, Loader2 } from 'lucide-react'

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
}: Props) {
  const [payments, setPayments] = useState(initialPayments)
  const [paid, setPaid] = useState(paidAmount)
  const [status, setStatus] = useState(paymentStatus)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const outstanding = Math.max(0, totalAmount - paid)
  const isFullyPaid = status === 'PAID'

  async function handleRecord(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const fd = new FormData(e.currentTarget)
      await recordAction(fd)
      // Refresh by reloading (server will revalidate)
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

  const statusColor = status === 'PAID' ? 'default' : status === 'PARTIAL' ? 'secondary' : 'outline'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="h-5 w-5" />
            Payment Reconciliation
          </CardTitle>
          <Badge variant={statusColor}>
            {status === 'PAID' ? 'Fully Paid' : status === 'PARTIAL' ? 'Part Paid' : 'Unpaid'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Invoice Total</p>
            <p className="text-lg font-bold">{fmt(totalAmount)}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Paid</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-400">{fmt(paid)}</p>
          </div>
          <div className={`rounded-lg border p-3 text-center ${outstanding > 0 ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30' : ''}`}>
            <p className="text-xs text-muted-foreground mb-0.5">Outstanding</p>
            <p className={`text-lg font-bold ${outstanding > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700'}`}>{fmt(outstanding)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalAmount > 0 && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (paid / totalAmount) * 100)}%` }}
            />
          </div>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">Method</th>
                  <th className="text-left px-3 py-2 font-medium">Reference</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(p => (
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
                        {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Record payment form */}
        {!isFullyPaid && (
          <>
            {!showForm ? (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-3.5 w-3.5" /> Record Payment
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
