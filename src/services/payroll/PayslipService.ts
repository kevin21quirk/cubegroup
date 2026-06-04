/**
 * PayslipService
 * Generates HTML payslips and dispatches them to workers via Gmail.
 */
import { prisma } from '@/lib/prisma'
import { getGmailSendService } from '@/services/email/GmailSendService'

export interface PayslipEntry {
  id: string
  workerName: string
  firstName?: string | null
  lastName?: string | null
  payrollWeek: string
  grossPay: number
  taxRate: number
  taxAmount: number
  feeAmount: number
  netToWorker: number
  hoursWorked: number
  hourlyRate: number
  companyName: string
  workerEmail?: string | null
}

export class PayslipService {
  private sender = getGmailSendService()

  generateHtml(entry: PayslipEntry): string {
    const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || entry.workerName
    const gross = entry.grossPay.toFixed(2)
    const tax   = entry.taxAmount.toFixed(2)
    const net   = entry.netToWorker.toFixed(2)
    const rate  = entry.taxRate.toFixed(1)

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Payslip – ${name}</title>
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
  .card { background: #fff; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .header { background: #1e3a5f; color: #fff; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p  { margin: 4px 0 0; opacity: .8; font-size: 14px; }
  .body { padding: 28px 32px; }
  .worker { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
  .week   { color: #666; font-size: 14px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; padding: 8px 12px; background: #f0f4f8; font-size: 12px; text-transform: uppercase; color: #555; }
  td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 15px; }
  td.amount { text-align: right; font-family: monospace; }
  .deduction { color: #c0392b; }
  .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #1e3a5f; border-bottom: none; }
  .net td { color: #27ae60; }
  .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>Payslip</h1>
    <p>Cube Group Payroll Services</p>
  </div>
  <div class="body">
    <div class="worker">${name}</div>
    <div class="week">Week: ${entry.payrollWeek} &nbsp;|&nbsp; Agency / Client: ${entry.companyName}</div>
    <table>
      <tr><th>Description</th><th style="text-align:right">Amount (£)</th></tr>
      ${entry.hoursWorked > 0 ? `<tr><td>Hours Worked (${entry.hoursWorked}h @ £${entry.hourlyRate.toFixed(2)}/h)</td><td class="amount">£${gross}</td></tr>` : `<tr><td>Gross Pay</td><td class="amount">£${gross}</td></tr>`}
      <tr><td class="deduction">CIS / Tax Deduction (${rate}%)</td><td class="amount deduction">-£${tax}</td></tr>
      ${entry.feeAmount > 0 ? `<tr><td class="deduction">Umbrella / Administration Fee</td><td class="amount deduction">-£${entry.feeAmount.toFixed(2)}</td></tr>` : ''}
    </table>
    <table>
      <tr class="total-row net"><td>NET PAY</td><td class="amount">£${net}</td></tr>
    </table>
    <p style="font-size:12px;color:#888;margin-top:16px">This payslip is generated automatically. If you have any queries please contact Cube Group.</p>
  </div>
  <div class="footer">Cube Group Payroll Services &bull; This is an automated email</div>
</div>
</body>
</html>`
  }

  async sendPayslip(entry: PayslipEntry): Promise<void> {
    if (!entry.workerEmail) throw new Error(`No email address for worker ${entry.workerName}`)
    const html = this.generateHtml(entry)
    const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || entry.workerName
    await this.sender.sendEmail(
      entry.workerEmail,
      `Your Payslip – Week ${entry.payrollWeek}`,
      html,
    )
    await prisma.payrollEntry.update({
      where: { id: entry.id },
      data: { payslipStatus: 'SENT', payslipSentAt: new Date() },
    })
  }
}

let instance: PayslipService | null = null
export function getPayslipService(): PayslipService {
  if (!instance) instance = new PayslipService()
  return instance
}
