/**
 * PayslipService
 * Generates a PDF payslip and dispatches it to workers via Gmail as an attachment.
 */
import { prisma } from '@/lib/prisma'
import { getGmailSendService } from '@/services/email/GmailSendService'
import { generatePayslipPdf } from './PdfPayslipService'

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
  // Company address details
  companyAddress?: string | null
  companyRef?: string | null
  companyUTR?: string | null
  // Worker address & tax details
  workerAddress1?: string | null
  workerAddress2?: string | null
  workerTown?: string | null
  workerPostCode?: string | null
  workerNI?: string | null
  workerUTR?: string | null
  // YTD (optional)
  ytdGross?: number | null
  ytdTax?: number | null
  payDate?: string | null
}

export class PayslipService {
  private sender = getGmailSendService()

  generateEmailBody(entry: PayslipEntry): string {
    const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || entry.workerName
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; color: #333; }
  .card { background: #fff; max-width: 520px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .header { background: #009900; color: #fff; padding: 20px 28px; }
  .header h2 { margin: 0; font-size: 18px; }
  .header p  { margin: 4px 0 0; opacity: .85; font-size: 13px; }
  .body { padding: 24px 28px; }
  .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #eee; font-size: 14px; }
  .row strong { color: #111; }
  .net { font-size: 16px; font-weight: bold; color: #009900; border-bottom: none; border-top: 2px solid #009900; margin-top: 4px; }
  .footer { background: #f9f9f9; padding: 12px 28px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h2>Payslip – ${entry.companyName}</h2>
    <p>${name} &nbsp;|&nbsp; ${entry.payrollWeek}</p>
  </div>
  <div class="body">
    <div class="row"><span>Gross Pay</span><strong>£${entry.grossPay.toFixed(2)}</strong></div>
    <div class="row"><span>CIS / Tax (${entry.taxRate}%)</span><strong>-£${entry.taxAmount.toFixed(2)}</strong></div>
    ${entry.feeAmount > 0 ? `<div class="row"><span>Administration Fee</span><strong>-£${entry.feeAmount.toFixed(2)}</strong></div>` : ''}
    <div class="row net"><span>Net Payment</span><strong>£${entry.netToWorker.toFixed(2)}</strong></div>
    <p style="font-size:12px;color:#888;margin-top:16px">Your payslip is attached as a PDF. If you have any queries please contact Cube Group.</p>
  </div>
  <div class="footer">Cube Group Payroll Services &bull; This is an automated email</div>
</div>
</body>
</html>`
  }

  async sendPayslip(entry: PayslipEntry): Promise<void> {
    if (!entry.workerEmail) throw new Error(`No email address for worker ${entry.workerName}`)

    const name = [entry.firstName, entry.lastName].filter(Boolean).join(' ') || entry.workerName

    const pdfBuffer = await generatePayslipPdf({
      workerName:    entry.workerName,
      firstName:     entry.firstName,
      lastName:      entry.lastName,
      workerAddress1: entry.workerAddress1,
      workerAddress2: entry.workerAddress2,
      workerTown:    entry.workerTown,
      workerPostCode: entry.workerPostCode,
      workerNI:      entry.workerNI,
      workerUTR:     entry.workerUTR,
      companyName:   entry.companyName,
      companyAddress: entry.companyAddress,
      companyRef:    entry.companyRef,
      companyUTR:    entry.companyUTR,
      payrollWeek:   entry.payrollWeek,
      payDate:       entry.payDate,
      grossPay:      entry.grossPay,
      taxRate:       entry.taxRate,
      taxAmount:     entry.taxAmount,
      feeAmount:     entry.feeAmount,
      netToWorker:   entry.netToWorker,
      hoursWorked:   entry.hoursWorked,
      hourlyRate:    entry.hourlyRate,
      ytdGross:      entry.ytdGross,
      ytdTax:        entry.ytdTax,
    })

    const safeWeek = (entry.payrollWeek ?? 'payslip').replace(/[^a-z0-9_\- ]/gi, '_')
    const filename = `Payslip_${name.replace(/\s+/g, '_')}_${safeWeek}.pdf`

    await this.sender.sendEmail(
      entry.workerEmail,
      `Your Payslip – ${entry.payrollWeek} – ${entry.companyName}`,
      this.generateEmailBody(entry),
      'Cube Group Payroll',
      [{ filename, mimeType: 'application/pdf', data: pdfBuffer }],
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
