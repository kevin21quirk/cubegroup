/**
 * PdfPayslipService
 * Generates a PDF payslip matching the green-bordered CIS payslip format.
 */
import PDFDocument from 'pdfkit'

const GREEN      = '#009900'
const LIGHT_GREEN = '#F0FFF0'

export interface PdfPayslipData {
  workerName: string
  firstName?: string | null
  lastName?: string | null
  workerAddress1?: string | null
  workerAddress2?: string | null
  workerTown?: string | null
  workerPostCode?: string | null
  workerNI?: string | null
  workerUTR?: string | null
  companyName: string
  companyAddress?: string | null
  companyRef?: string | null
  companyUTR?: string | null
  payrollWeek: string
  payDate?: string | null
  grossPay: number
  taxRate: number
  taxAmount: number
  feeAmount: number
  netToWorker: number
  hoursWorked?: number | null
  hourlyRate?: number | null
  ytdGross?: number | null
  ytdTax?: number | null
}

export async function generatePayslipPdf(data: PdfPayslipData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [595, 420],
      margin: 0,
      info: {
        Title: `Payslip – ${[data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName}`,
        Author: 'Cube Group Payroll',
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const M  = 10
    const PW = 595
    const PH = 420
    const IW = PW - 2 * M       // 575

    const headerH = 65
    const footerH = 42
    const bodyY   = M + headerH + 2
    const bodyH   = PH - M - headerH - 2 - footerH - 2
    const footerY = PH - M - footerH

    // Column widths (proportional to original design)
    const c1W = Math.round(IW * 0.38)   // ~218  left – worker address
    const c3W = Math.round(IW * 0.35)   // ~201  right – payments
    const c2W = IW - c1W - c3W          // ~156  middle – pay details
    const c1X = M
    const c2X = c1X + c1W
    const c3X = c2X + c2W

    const workerName = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName
    const numW = 52
    const nX   = c3X + c3W - numW - 4

    // ── Outer border ──────────────────────────────────────────────
    doc.rect(M, M, IW, PH - 2 * M).stroke(GREEN)

    // ── Header ────────────────────────────────────────────────────
    doc.rect(M, M, IW, headerH).stroke(GREEN)

    doc.font('Helvetica-Bold').fontSize(18).fillColor('black')
       .text(data.companyName, M, M + 14, { width: IW, align: 'center', lineBreak: false })

    const addrParts: string[] = []
    if (data.companyAddress) addrParts.push(data.companyAddress)
    if (data.companyRef)     addrParts.push(`Ref: ${data.companyRef}`)
    if (data.companyUTR)     addrParts.push(`UTR: ${data.companyUTR}`)

    doc.font('Helvetica').fontSize(8.5).fillColor('black')
       .text(addrParts.join('   '), M, M + 42, { width: IW, align: 'center', lineBreak: false })

    // ── Body column borders ────────────────────────────────────────
    doc.rect(c1X, bodyY, c1W, bodyH).stroke(GREEN)
    doc.rect(c2X, bodyY, c2W, bodyH).stroke(GREEN)
    doc.rect(c3X, bodyY, c3W, bodyH).stroke(GREEN)

    // ── Left col: worker address box ──────────────────────────────
    const bPad = 5
    const boxY = bodyY + 18
    const boxH = 122
    doc.rect(c1X + bPad, boxY, c1W - 2 * bPad, boxH).stroke(GREEN)

    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('black')
       .text(workerName, c1X + bPad + 6, boxY + 9, { width: c1W - 2 * bPad - 10, lineBreak: false })

    const addrLines = [
      data.workerAddress1,
      data.workerAddress2,
      data.workerTown,
      data.workerPostCode,
    ].filter(Boolean) as string[]

    doc.font('Helvetica').fontSize(9.5)
    let ay = boxY + 25
    for (const line of addrLines) {
      doc.fillColor('black').text(line, c1X + bPad + 6, ay, { width: c1W - 2 * bPad - 10, lineBreak: false })
      ay += 14
    }

    // ── Middle col: pay details ────────────────────────────────────
    const payDate = data.payDate ??
      new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const payRows: [string, string][] = [
      ['Pay Period',       data.payrollWeek],
      ['Pay Date',         payDate],
      ['Pay Type',         'Weekly'],
      ['Payment Method',   'Bank Transfer'],
      ['', ''],
      ['NI Number',        data.workerNI  ?? '—'],
      ['Unique Tax Ref.',  data.workerUTR ?? '—'],
      ['Tax Treatment',    'Net'],
      ['Deduction Rate',   `${data.taxRate}%`],
    ]

    let ry = bodyY + 8
    for (const [label, value] of payRows) {
      if (!label) { ry += 5; continue }
      doc.font('Helvetica').fontSize(8.5).fillColor('black')
         .text(label, c2X + 6, ry, { width: 90, lineBreak: false })
      doc.font('Helvetica-Bold').fontSize(8.5)
         .text(value, c2X + 95, ry, { width: c2W - 98, lineBreak: false })
      ry += 14
    }

    // YTD box at bottom of middle col
    const ytdH = 62
    const ytdY = bodyY + bodyH - ytdH
    doc.rect(c2X, ytdY, c2W, ytdH).fillAndStroke('#FFFFFF', GREEN)

    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('black')
       .text('Year to Date', c2X, ytdY + 9, { width: c2W, align: 'center', lineBreak: false })
    doc.moveTo(c2X + 2, ytdY + 22).lineTo(c2X + c2W - 2, ytdY + 22).stroke(GREEN)

    const ytdGross = data.ytdGross ?? data.grossPay
    const ytdTax   = data.ytdTax   ?? data.taxAmount

    doc.font('Helvetica').fontSize(8.5).fillColor('black')
       .text('Total payments', c2X + 8, ytdY + 28, { lineBreak: false })
       .text(ytdGross.toFixed(2), c2X + c2W - 54, ytdY + 28, { width: 48, align: 'right', lineBreak: false })
       .text('CIS Deduction',  c2X + 8, ytdY + 43, { lineBreak: false })
       .text(ytdTax.toFixed(2), c2X + c2W - 54, ytdY + 43, { width: 48, align: 'right', lineBreak: false })

    // ── Right col: Payments ────────────────────────────────────────
    const gross = data.grossPay

    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('black')
       .text('Payments', c3X, bodyY + 8, { width: c3W, align: 'center', lineBreak: false })
    doc.moveTo(c3X + 1, bodyY + 21).lineTo(c3X + c3W - 1, bodyY + 21).stroke(GREEN)

    doc.font('Helvetica').fontSize(8.5).fillColor('black')
       .text('Basic Payment', c3X + 6, bodyY + 26, { lineBreak: false })
       .text(gross.toFixed(2), nX, bodyY + 26, { width: numW, align: 'right', lineBreak: false })

    doc.font('Helvetica-Bold').fontSize(8.5)
       .text('Total Payments', c3X + 6, bodyY + 40, { lineBreak: false })
       .text(gross.toFixed(2), nX, bodyY + 40, { width: numW, align: 'right', lineBreak: false })
       .text('Amount Subject to Deduction', c3X + 6, bodyY + 54, { width: c3W - numW - 14, lineBreak: false })
       .text(gross.toFixed(2), nX, bodyY + 54, { width: numW, align: 'right', lineBreak: false })

    // Deductions
    const dedY       = bodyY + 72
    const totalDeductions = (data.feeAmount ?? 0) + data.taxAmount

    doc.moveTo(c3X + 1, dedY).lineTo(c3X + c3W - 1, dedY).stroke(GREEN)
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('black')
       .text('Deductions', c3X, dedY + 6, { width: c3W, align: 'center', lineBreak: false })
    doc.moveTo(c3X + 1, dedY + 20).lineTo(c3X + c3W - 1, dedY + 20).stroke(GREEN)

    doc.font('Helvetica').fontSize(8.5).fillColor('black')
       .text('Fees',          c3X + 6, dedY + 26, { lineBreak: false })
       .text((data.feeAmount ?? 0).toFixed(2), nX, dedY + 26, { width: numW, align: 'right', lineBreak: false })
       .text('CIS Deduction', c3X + 6, dedY + 40, { lineBreak: false })
       .text(data.taxAmount.toFixed(2),         nX, dedY + 40, { width: numW, align: 'right', lineBreak: false })

    doc.font('Helvetica-Bold').fontSize(8.5)
       .text('Total Deductions', c3X + 6, dedY + 54, { lineBreak: false })
       .text(totalDeductions.toFixed(2), nX, dedY + 54, { width: numW, align: 'right', lineBreak: false })

    // ── Footer ─────────────────────────────────────────────────────
    doc.rect(c1X, footerY, c1W + c2W, footerH).stroke(GREEN)
    doc.rect(c3X, footerY, c3W, footerH).fillAndStroke(LIGHT_GREEN, GREEN)

    doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
       .text('Net Payment', c3X + 10, footerY + 13, { lineBreak: false })
       .text(data.netToWorker.toFixed(2), c3X + 10, footerY + 13, { width: c3W - 20, align: 'right', lineBreak: false })

    doc.end()
  })
}
