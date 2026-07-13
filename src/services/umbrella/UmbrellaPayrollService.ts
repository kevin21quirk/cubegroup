/**
 * UmbrellaPayrollService
 * Generates a payroll CSV for each umbrella company linked to a submission
 * and emails it to their contact address.
 */
import { prisma } from '@/lib/prisma'
import { GmailSendService } from '@/services/email/GmailSendService'

export class UmbrellaPayrollService {
  private mailer: GmailSendService

  constructor() {
    this.mailer = new GmailSendService()
  }

  async getCsvForDownload(payrollSubmissionId: string): Promise<{ filename: string; csv: string }> {
    const submission = await prisma.payrollSubmission.findUnique({
      where: { id: payrollSubmissionId },
      include: {
        company: true,
        payrollEntries: { include: { worker: true } },
      },
    })
    if (!submission) throw new Error('Payroll submission not found')

    const csv = this.buildCsv(submission.payrollEntries, submission.company.name, submission.payrollWeek)
    const filename = `Payroll_${submission.company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${submission.payrollWeek}.csv`
    return { filename, csv }
  }

  async sendPayrollCsvForSubmission(payrollSubmissionId: string): Promise<{
    sent: number
    errors: string[]
  }> {
    const submission = await prisma.payrollSubmission.findUnique({
      where: { id: payrollSubmissionId },
      include: {
        company: { include: { umbrellaCompany: true } },
        payrollEntries: {
          include: {
            umbrellaCompany: true,
            worker: true,
          },
        },
      },
    })

    if (!submission) throw new Error('Payroll submission not found')

    // Resolve the company-level default umbrella (fallback)
    const companyUmbrella = (submission.company as any).umbrellaCompany as
      (typeof submission.payrollEntries[0]['umbrellaCompany']) | null | undefined

    // Group entries by umbrella company (fall back to company-level umbrella)
    const byUmbrella = new Map<string, typeof submission.payrollEntries>()
    for (const entry of submission.payrollEntries) {
      const umbrella = entry.umbrellaCompany ?? companyUmbrella
      if (!umbrella) continue
      // Attach the resolved umbrella onto the entry so buildCsv can read it
      ;(entry as any)._resolvedUmbrella = umbrella
      const key = umbrella.id
      if (!byUmbrella.has(key)) byUmbrella.set(key, [])
      byUmbrella.get(key)!.push(entry)
    }

    // Also collect entries with no umbrella company for the default send
    const noUmbrella = submission.payrollEntries.filter(
      e => !e.umbrellaCompany && !companyUmbrella
    )

    let sent = 0
    const errors: string[] = []

    // Send to each umbrella company
    for (const [, entries] of byUmbrella) {
      const umbrella = ((entries[0] as any)._resolvedUmbrella ?? entries[0].umbrellaCompany)!
      try {
        const csv = this.buildCsv(entries, submission.company.name, submission.payrollWeek)
        const filename = `Payroll_${submission.company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${submission.payrollWeek}.csv`

        await this.mailer.sendEmail(
          umbrella.contactEmail,
          `Payroll CSV – ${submission.company.name} – Week ${submission.payrollWeek}`,
          this.buildEmailBody(umbrella.name, submission.company.name, submission.payrollWeek, entries.length),
          'Cube Group Payroll',
          [{
            filename,
            mimeType: 'text/csv',
            data: Buffer.from(csv, 'utf-8'),
          }]
        )
        sent++
      } catch (err: any) {
        errors.push(`${umbrella.name}: ${err.message}`)
      }
    }

    // If some entries have no umbrella company assigned, log a warning (don't block)
    if (noUmbrella.length > 0) {
      errors.push(`${noUmbrella.length} entries have no umbrella company assigned — not sent`)
    }

    return { sent, errors }
  }

  private buildCsv(
    entries: Array<{
      workerName: string
      firstName: string | null
      lastName: string | null
      hoursWorked: number
      hourlyRate: number
      grossPay: number
      totalGrossPay: number
      taxAmount: number
      feeAmount: number
      umbrellaShareAmount: number
      netToWorker: number
      expenseAmount?: number | null
      expenseNotes?: string | null
      payrollWeek: string
      worker?: { nationalInsurance?: string | null } | null
    }>,
    companyName: string,
    payrollWeek: string
  ): string {
    const headers = [
      'Worker Name',
      'NI Number',
      'Payroll Week',
      'Hours Worked',
      'Hourly Rate',
      'Gross Pay',
      'CIS Tax Deduction',
      'Umbrella Fee',
      'Expenses',
      'Net to Worker',
    ]

    const rows = entries.map(e => {
      const gross = e.grossPay || e.totalGrossPay
      const expenses = e.expenseAmount ?? 0
      const name = [e.firstName, e.lastName].filter(Boolean).join(' ') || e.workerName
      return [
        this.csvCell(name),
        this.csvCell(e.worker?.nationalInsurance || ''),
        this.csvCell(e.payrollWeek || payrollWeek),
        e.hoursWorked,
        e.hourlyRate.toFixed(2),
        gross.toFixed(2),
        e.taxAmount.toFixed(2),
        e.umbrellaShareAmount.toFixed(2),
        expenses.toFixed(2),
        e.netToWorker.toFixed(2),
      ]
    })

    const totalsGross    = entries.reduce((s, e) => s + (e.grossPay || e.totalGrossPay), 0)
    const totalsTax      = entries.reduce((s, e) => s + e.taxAmount, 0)
    const totalsFee      = entries.reduce((s, e) => s + e.umbrellaShareAmount, 0)
    const totalsExpenses = entries.reduce((s, e) => s + (e.expenseAmount ?? 0), 0)
    const totalsNet      = entries.reduce((s, e) => s + e.netToWorker, 0)

    const totalsRow = ['TOTAL', '', '', '', '', totalsGross.toFixed(2), totalsTax.toFixed(2), totalsFee.toFixed(2), totalsExpenses.toFixed(2), totalsNet.toFixed(2)]

    return [
      `# Payroll CSV – ${companyName} – Week ${payrollWeek}`,
      headers.join(','),
      ...rows.map(r => r.join(',')),
      totalsRow.join(','),
    ].join('\r\n')
  }

  private csvCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private buildEmailBody(
    umbrellaName: string,
    companyName: string,
    payrollWeek: string,
    workerCount: number
  ): string {
    return `
      <p>Dear ${umbrellaName},</p>
      <p>Please find attached the payroll CSV for <strong>${companyName}</strong> for payroll week <strong>${payrollWeek}</strong>.</p>
      <p>This file covers <strong>${workerCount} worker(s)</strong> and includes gross pay, CIS tax deductions, umbrella fees, and net-to-worker amounts.</p>
      <p>Please process this payroll at your earliest convenience.</p>
      <br />
      <p>Regards,<br />Cube Group Payroll</p>
    `.trim()
  }
}
