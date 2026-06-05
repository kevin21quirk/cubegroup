/**
 * PdfPayslipService
 * Generates a PDF payslip matching the green-bordered CIS payslip format.
 * Uses pdf-lib (pure JS, no file-system font deps) for Vercel compatibility.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const GREEN       = rgb(0,    0.6,  0)      // #009900
const LIGHT_GREEN = rgb(0.94, 1,    0.94)   // #F0FFF4
const BLACK       = rgb(0,    0,    0)
const WHITE       = rgb(1,    1,    1)

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
  const PW = 595, PH = 420, M = 10
  const IW = PW - 2 * M  // 575

  const headerH = 65
  const footerH = 42
  const bodyY   = M + headerH + 2        // 77 from top
  const bodyH   = PH - M - headerH - 2 - footerH - 2  // 299
  const footerY = PH - M - footerH       // 368 from top

  const c1W = Math.round(IW * 0.38)      // ~218 left
  const c3W = Math.round(IW * 0.35)      // ~201 right
  const c2W = IW - c1W - c3W            // ~156 middle
  const c1X = M, c2X = c1X + c1W, c3X = c2X + c2W

  // pdf-lib uses bottom-left origin; convert top-down Y values
  const bY  = (topY: number, h = 0) => PH - topY - h
  const BDR = { borderColor: GREEN, borderWidth: 1 }

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Payslip - ${[data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName}`)
  pdfDoc.setAuthor('Cube Group Payroll')

  const page     = pdfDoc.addPage([PW, PH])
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const workerName = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName

  // Draw text: topY = distance from top of page; y = PDF baseline
  const t = (text: string, x: number, topY: number, sz: number, f = font, color = BLACK) =>
    page.drawText(String(text), { x, y: bY(topY) - sz * 0.75, font: f, size: sz, color })

  // Right-aligned text ending at rightX
  const tr = (text: string, rightX: number, topY: number, sz: number, f = font) =>
    t(text, rightX - f.widthOfTextAtSize(String(text), sz), topY, sz, f)

  // Centre-aligned text within a box
  const tc = (text: string, boxX: number, boxW: number, topY: number, sz: number, f = font) =>
    t(text, boxX + (boxW - f.widthOfTextAtSize(String(text), sz)) / 2, topY, sz, f)

  // Rectangle helper (top-left coords)
  const r = (x: number, topY: number, w: number, h: number, opts = {}) =>
    page.drawRectangle({ x, y: bY(topY, h), width: w, height: h, ...opts })

  // Horizontal line helper
  const hl = (x1: number, topY: number, x2: number) =>
    page.drawLine({ start: { x: x1, y: bY(topY) }, end: { x: x2, y: bY(topY) }, thickness: 1, color: GREEN })

  // ── Outer border ───────────────────────────────────────────────
  r(M, M, IW, PH - 2 * M, BDR)

  // ── Header ─────────────────────────────────────────────────────
  r(M, M, IW, headerH, BDR)
  tc(data.companyName, M, IW, M + 14, 18, fontBold)

  const addrParts: string[] = []
  if (data.companyAddress) addrParts.push(data.companyAddress)
  if (data.companyRef)     addrParts.push(`Ref: ${data.companyRef}`)
  if (data.companyUTR)     addrParts.push(`UTR: ${data.companyUTR}`)
  if (addrParts.length)    tc(addrParts.join('   '), M, IW, M + 42, 8.5)

  // ── Body columns ───────────────────────────────────────────────
  r(c1X, bodyY, c1W, bodyH, BDR)
  r(c2X, bodyY, c2W, bodyH, BDR)
  r(c3X, bodyY, c3W, bodyH, BDR)

  // ── Left: worker address box ───────────────────────────────────
  const bPad = 5, boxTopY = bodyY + 18, boxH = 122
  r(c1X + bPad, boxTopY, c1W - 2 * bPad, boxH, BDR)
  t(workerName, c1X + bPad + 6, boxTopY + 9, 10.5, fontBold)

  let ay = boxTopY + 25
  for (const line of [data.workerAddress1, data.workerAddress2, data.workerTown, data.workerPostCode].filter(Boolean) as string[]) {
    t(line, c1X + bPad + 6, ay, 9.5); ay += 14
  }

  // ── Middle: pay details ────────────────────────────────────────
  const payDate = data.payDate ??
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const payRows: [string, string][] = [
    ['Pay Period',      data.payrollWeek],
    ['Pay Date',        payDate],
    ['Pay Type',        'Weekly'],
    ['Payment Method',  'Bank Transfer'],
    ['', ''],
    ['NI Number',       data.workerNI  ?? '-'],
    ['Unique Tax Ref.', data.workerUTR ?? '-'],
    ['Tax Treatment',   'Net'],
    ['Deduction Rate',  `${data.taxRate}%`],
  ]
  let ry2 = bodyY + 8
  for (const [label, value] of payRows) {
    if (!label) { ry2 += 5; continue }
    t(label, c2X + 6, ry2, 8.5)
    t(value, c2X + 95, ry2, 8.5, fontBold)
    ry2 += 14
  }

  // YTD box
  const ytdH = 62, ytdTopY = bodyY + bodyH - ytdH
  r(c2X, ytdTopY, c2W, ytdH, { color: WHITE, ...BDR })
  tc('Year to Date', c2X, c2W, ytdTopY + 9, 9.5, fontBold)
  hl(c2X + 2, ytdTopY + 22, c2X + c2W - 2)
  const ytdGross = data.ytdGross ?? data.grossPay
  const ytdTax   = data.ytdTax   ?? data.taxAmount
  t('Total payments', c2X + 8, ytdTopY + 28, 8.5)
  tr(ytdGross.toFixed(2), c2X + c2W - 6, ytdTopY + 28, 8.5)
  t('CIS Deduction',  c2X + 8, ytdTopY + 43, 8.5)
  tr(ytdTax.toFixed(2), c2X + c2W - 6, ytdTopY + 43, 8.5)

  // ── Right: Payments ────────────────────────────────────────────
  const gross = data.grossPay, grossStr = gross.toFixed(2)

  tc('Payments', c3X, c3W, bodyY + 8, 9.5, fontBold)
  hl(c3X + 1, bodyY + 21, c3X + c3W - 1)
  t('Basic Payment',               c3X + 6, bodyY + 26, 8.5)
  tr(grossStr, c3X + c3W - 6, bodyY + 26, 8.5, fontBold)
  t('Total Payments',              c3X + 6, bodyY + 40, 8.5, fontBold)
  tr(grossStr, c3X + c3W - 6, bodyY + 40, 8.5, fontBold)
  t('Amount Subject to Deduction', c3X + 6, bodyY + 54, 8.5, fontBold)
  tr(grossStr, c3X + c3W - 6, bodyY + 54, 8.5, fontBold)

  // ── Right: Deductions ──────────────────────────────────────────
  const dedTopY = bodyY + 72
  const totalDed = (data.feeAmount ?? 0) + data.taxAmount

  hl(c3X + 1, dedTopY, c3X + c3W - 1)
  tc('Deductions', c3X, c3W, dedTopY + 6, 9.5, fontBold)
  hl(c3X + 1, dedTopY + 20, c3X + c3W - 1)
  t('Fees',             c3X + 6, dedTopY + 26, 8.5)
  tr((data.feeAmount ?? 0).toFixed(2), c3X + c3W - 6, dedTopY + 26, 8.5)
  t('CIS Deduction',   c3X + 6, dedTopY + 40, 8.5)
  tr(data.taxAmount.toFixed(2), c3X + c3W - 6, dedTopY + 40, 8.5)
  t('Total Deductions', c3X + 6, dedTopY + 54, 8.5, fontBold)
  tr(totalDed.toFixed(2), c3X + c3W - 6, dedTopY + 54, 8.5, fontBold)

  // ── Footer ─────────────────────────────────────────────────────
  r(c1X, footerY, c1W + c2W, footerH, BDR)
  r(c3X, footerY, c3W, footerH, { color: LIGHT_GREEN, ...BDR })
  t('Net Payment', c3X + 10, footerY + 13, 12, fontBold)
  tr(data.netToWorker.toFixed(2), c3X + c3W - 10, footerY + 13, 12, fontBold)

  return Buffer.from(await pdfDoc.save())
}
