/**
 * PdfPayslipService
 * Generates a PDF payslip matching the green-bordered CIS payslip format.
 * Uses pdf-lib (pure JS, no file-system font deps) for Vercel compatibility.
 */
import {
  PDFDocument, PDFPage, StandardFonts, rgb, RGB,
  PDFOperator, PDFOperatorNames, PDFNumber,
  pushGraphicsState, popGraphicsState,
  moveTo, lineTo, closePath,
  setFillingColor, setStrokingColor, setLineWidth,
  fillAndStroke, fill as pdfFill, stroke as pdfStroke,
} from 'pdf-lib'

// curveTo is in the pdf-lib bundle but missing from its TypeScript declarations
const curveTo = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): PDFOperator =>
  PDFOperator.of('c' as PDFOperatorNames, [
    PDFNumber.of(x1), PDFNumber.of(y1),
    PDFNumber.of(x2), PDFNumber.of(y2),
    PDFNumber.of(x3), PDFNumber.of(y3),
  ])

const GREEN       = rgb(0,    0.8,  0)      // #00CC00 bright lime
const LIGHT_GREEN = rgb(0.8,  1.0,  0.8)   // #CCFFCC mint green
const BLACK       = rgb(0,    0,    0)
const WHITE       = rgb(1,    1,    1)
const BORDER_W    = 1.5
const RADIUS      = 6
const K           = 0.5523  // Bézier constant for quarter-circle approximation

/**
 * Draw a rounded rectangle using cubic Bézier curves via pushOperators.
 * All coordinates are in pdf-lib space (bottom-left origin, Y increases up).
 * x, y = bottom-left corner; w, h = width/height; r = corner radius.
 */
function drawRR(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  fill?: RGB, stroke?: RGB, strokeW = BORDER_W, r = RADIUS,
) {
  const kr = K * r
  const ops = [
    pushGraphicsState(),
    ...(fill   ? [setFillingColor(fill)]           : []),
    ...(stroke ? [setStrokingColor(stroke), setLineWidth(strokeW)] : []),
    // Path — starting bottom-left, going clockwise
    moveTo(x + r, y),
    lineTo(x + w - r, y),
    curveTo(x + w - r + kr, y,       x + w, y + r - kr,       x + w, y + r),
    lineTo(x + w, y + h - r),
    curveTo(x + w, y + h - r + kr,   x + w - r + kr, y + h,   x + w - r, y + h),
    lineTo(x + r, y + h),
    curveTo(x + r - kr, y + h,       x, y + h - r + kr,       x, y + h - r),
    lineTo(x, y + r),
    curveTo(x, y + r - kr,           x + r - kr, y,           x + r, y),
    closePath(),
    fill && stroke ? fillAndStroke() : fill ? pdfFill() : pdfStroke(),
    popGraphicsState(),
  ]
  page.pushOperators(...ops)
}

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
  feeSource?: string | null
  expenseAmount?: number | null
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
  const bodyY   = M + headerH + 2
  const bodyH   = PH - M - headerH - 2 - footerH - 2
  const footerY = PH - M - footerH

  const c1W = Math.round(IW * 0.38)
  const c3W = Math.round(IW * 0.35)
  const c2W = IW - c1W - c3W
  const c1X = M, c2X = c1X + c1W, c3X = c2X + c2W

  // pdf-lib uses bottom-left origin; convert top-down Y to bottom-up
  const bY = (topY: number, h = 0) => PH - topY - h

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Payslip - ${[data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName}`)
  pdfDoc.setAuthor('Cube Group Payroll')

  const page     = pdfDoc.addPage([PW, PH])
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const workerName = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.workerName

  // Rounded rect helper: topY/h in top-down coords → converts to bottom-left
  const rr = (x: number, topY: number, w: number, h: number, fill?: RGB, stroke?: RGB, r = RADIUS) =>
    drawRR(page, x, bY(topY, h), w, h, fill, stroke, BORDER_W, r)

  // Text: topY in top-down coords
  const t = (text: string, x: number, topY: number, sz: number, f = font, color = BLACK) =>
    page.drawText(String(text), { x, y: bY(topY) - sz * 0.75, font: f, size: sz, color })

  // Right-aligned text ending at rightX
  const tr = (text: string, rightX: number, topY: number, sz: number, f = font) =>
    t(text, rightX - f.widthOfTextAtSize(String(text), sz), topY, sz, f)

  // Centre-aligned text within a box
  const tc = (text: string, boxX: number, boxW: number, topY: number, sz: number, f = font) =>
    t(text, boxX + (boxW - f.widthOfTextAtSize(String(text), sz)) / 2, topY, sz, f)

  // Horizontal line helper
  const hl = (x1: number, topY: number, x2: number) =>
    page.drawLine({ start: { x: x1, y: bY(topY) }, end: { x: x2, y: bY(topY) }, thickness: 1, color: GREEN })

  // ── 1. Outer container – LIGHT_GREEN fill, GREEN border, rounded ──
  rr(M, M, IW, PH - 2 * M, LIGHT_GREEN, GREEN)

  // ── 2. Header – WHITE fill, GREEN border, rounded ─────────────────
  rr(M + 4, M + 4, IW - 8, headerH - 6, WHITE, GREEN)
  tc(data.companyName, M, IW, M + 14, 18, fontBold)

  const addrParts: string[] = []
  if (data.companyAddress) addrParts.push(data.companyAddress)
  if (data.companyRef)     addrParts.push(`Ref: ${data.companyRef}`)
  if (data.companyUTR)     addrParts.push(`UTR: ${data.companyUTR}`)
  if (addrParts.length)    tc(addrParts.join('   '), M, IW, M + 40, 8.5)

  // Pre-calculate YTD geometry so the pay-details box knows its height
  const ytdH = 62, ytdTopY = bodyY + bodyH - ytdH
  const ytdGap = 3  // gap between pay-details box and YTD box

  // ── 3. Body column boxes ────────────────────────────────────────────
  rr(c1X, bodyY, c1W, bodyH, undefined, GREEN)                // left  – transparent
  rr(c2X, bodyY, c2W, ytdTopY - bodyY - ytdGap, WHITE, GREEN) // middle upper – WHITE
  rr(c3X, bodyY, c3W, bodyH, WHITE, GREEN)                   // right – WHITE

  // ── 4. Left: worker address box – WHITE fill, rounded ─────────────
  const bPad = 5, boxTopY = bodyY + 18, boxH = 122
  rr(c1X + bPad, boxTopY, c1W - 2 * bPad, boxH, WHITE, GREEN, 5)
  t(workerName, c1X + bPad + 6, boxTopY + 9, 10.5, fontBold)

  let ay = boxTopY + 25
  for (const line of [data.workerAddress1, data.workerAddress2, data.workerTown, data.workerPostCode].filter(Boolean) as string[]) {
    t(line, c1X + bPad + 6, ay, 9.5); ay += 14
  }

  // ── 5. Middle: pay details ─────────────────────────────────────────
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

  // YTD box – WHITE fill, rounded
  rr(c2X, ytdTopY, c2W, ytdH, WHITE, GREEN, 4)
  tc('Year to Date', c2X, c2W, ytdTopY + 9, 9.5, fontBold)
  hl(c2X + 2, ytdTopY + 22, c2X + c2W - 2)
  const ytdGross = data.ytdGross ?? data.grossPay
  const ytdTax   = data.ytdTax   ?? data.taxAmount
  t('Total payments', c2X + 8, ytdTopY + 28, 8.5)
  tr(ytdGross.toFixed(2), c2X + c2W - 6, ytdTopY + 28, 8.5)
  t('CIS Deduction',  c2X + 8, ytdTopY + 43, 8.5)
  tr(ytdTax.toFixed(2), c2X + c2W - 6, ytdTopY + 43, 8.5)

  // ── 6. Right: Payments ─────────────────────────────────────────────
  const gross = data.grossPay, grossStr = gross.toFixed(2)
  const expAmt = data.expenseAmount ?? 0
  const totalPayStr = (gross + expAmt).toFixed(2)

  tc('Payments', c3X, c3W, bodyY + 8, 9.5, fontBold)
  hl(c3X + 1, bodyY + 21, c3X + c3W - 1)
  t('Basic Payment',               c3X + 6, bodyY + 26, 8.5)
  tr(grossStr, c3X + c3W - 6, bodyY + 26, 8.5, fontBold)

  let payRowY = bodyY + 40
  if (expAmt > 0) {
    t('Expenses',                  c3X + 6, payRowY, 8.5)
    tr(expAmt.toFixed(2), c3X + c3W - 6, payRowY, 8.5, fontBold)
    payRowY += 14
  }
  t('Total Payments',              c3X + 6, payRowY, 8.5, fontBold)
  tr(totalPayStr, c3X + c3W - 6, payRowY, 8.5, fontBold)
  payRowY += 14
  t('Amount Subject to Deduction', c3X + 6, payRowY, 8.5, fontBold)
  tr(grossStr, c3X + c3W - 6, payRowY, 8.5, fontBold)

  // ── 7. Right: Deductions ───────────────────────────────────────────
  const showFee  = data.feeSource === 'WORKER' && (data.feeAmount ?? 0) > 0
  const dedTopY  = payRowY + 18
  const totalDed = (showFee ? (data.feeAmount ?? 0) : 0) + data.taxAmount

  hl(c3X + 1, dedTopY, c3X + c3W - 1)
  tc('Deductions', c3X, c3W, dedTopY + 6, 9.5, fontBold)
  hl(c3X + 1, dedTopY + 20, c3X + c3W - 1)
  if (showFee) {
    t('Fees',           c3X + 6, dedTopY + 26, 8.5)
    tr((data.feeAmount ?? 0).toFixed(2), c3X + c3W - 6, dedTopY + 26, 8.5)
    t('CIS Deduction',  c3X + 6, dedTopY + 40, 8.5)
    tr(data.taxAmount.toFixed(2), c3X + c3W - 6, dedTopY + 40, 8.5)
    t('Total Deductions', c3X + 6, dedTopY + 54, 8.5, fontBold)
    tr(totalDed.toFixed(2), c3X + c3W - 6, dedTopY + 54, 8.5, fontBold)
  } else {
    t('CIS Deduction',  c3X + 6, dedTopY + 26, 8.5)
    tr(data.taxAmount.toFixed(2), c3X + c3W - 6, dedTopY + 26, 8.5)
    t('Total Deductions', c3X + 6, dedTopY + 40, 8.5, fontBold)
    tr(totalDed.toFixed(2), c3X + c3W - 6, dedTopY + 40, 8.5, fontBold)
  }

  // ── 8. Footer ──────────────────────────────────────────────────────
  // Right (Net Payment): WHITE fill, GREEN border, rounded
  rr(c3X, footerY, c3W, footerH, WHITE, GREEN)
  t('Net Payment', c3X + 10, footerY + 13, 12, fontBold)
  tr(data.netToWorker.toFixed(2), c3X + c3W - 10, footerY + 13, 12, fontBold)

  return Buffer.from(await pdfDoc.save())
}
