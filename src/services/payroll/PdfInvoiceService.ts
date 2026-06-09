/**
 * PdfInvoiceService
 * Generates a clean A4 PDF invoice using pdf-lib.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const DARK  = rgb(0.067, 0.094, 0.153) // #111827
const MID   = rgb(0.42,  0.45,  0.50)  // muted text
const LIGHT = rgb(0.95,  0.96,  0.97)  // table header bg
const BLACK = rgb(0,     0,     0)
const WHITE = rgb(1,     1,     1)
const ACCENT = rgb(0.22, 0.60,  0.26)  // green accent line

export interface InvoiceLineItem {
  description: string
  quantity:    number
  unitPrice:   number
  amount:      number
}

export interface PdfInvoiceData {
  invoiceNumber:  string
  issueDate:      Date
  dueDate:        Date
  billingName:    string
  billingAddress?: string | null
  billingCity?:   string | null
  billingPostcode?: string | null
  subtotal:       number
  vatAmount:      number
  totalAmount:    number
  items:          InvoiceLineItem[]
  ourName?:       string
  ourAddress?:    string
}

function fmt(n: number) {
  return '£' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function generateInvoicePdf(data: PdfInvoiceData): Promise<Buffer> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()

  const fontReg  = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  // ── helpers ──────────────────────────────────────────────────────────────
  const t = (text: string, x: number, y: number, size: number, font = fontReg, color = BLACK) => {
    page.drawText(text, { x, y: height - y, size, font, color })
  }
  const tr = (text: string, rightX: number, y: number, size: number, font = fontReg, color = BLACK) => {
    const w = font.widthOfTextAtSize(text, size)
    page.drawText(text, { x: rightX - w, y: height - y, size, font, color })
  }
  const line = (x1: number, y1: number, x2: number, y2: number, color = LIGHT, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y: height - y1 }, end: { x: x2, y: height - y2 }, color, thickness })
  }
  const rect = (x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) => {
    page.drawRectangle({ x, y: height - y - h, width: w, height: h, color })
  }

  const L = 45, R = width - 45, CONTENT_W = R - L

  // ── accent bar ───────────────────────────────────────────────────────────
  rect(0, 0, width, 8, ACCENT)

  // ── header ───────────────────────────────────────────────────────────────
  t('INVOICE', L, 52, 26, fontBold, DARK)
  t(data.invoiceNumber, L, 72, 11, fontReg, MID)

  const ourName = data.ourName ?? 'Cube Group Payroll Services'
  tr(ourName, R, 52, 11, fontBold, DARK)

  // ── divider ──────────────────────────────────────────────────────────────
  line(L, 88, R, 88, DARK, 0.4)

  // ── bill-to + dates ──────────────────────────────────────────────────────
  t('BILLED TO', L, 108, 7.5, fontBold, MID)
  const addrLines = [
    data.billingName,
    data.billingAddress,
    [data.billingCity, data.billingPostcode].filter(Boolean).join('  '),
  ].filter(Boolean) as string[]
  addrLines.forEach((l, i) => t(l, L, 122 + i * 14, 9.5, i === 0 ? fontBold : fontReg, DARK))

  // issue / due dates on right
  t('ISSUE DATE', R - 180, 108, 7.5, fontBold, MID)
  t(fmtDate(data.issueDate), R - 180, 122, 9.5, fontReg, DARK)
  t('DUE DATE', R - 80, 108, 7.5, fontBold, MID)
  t(fmtDate(data.dueDate), R - 80, 122, 9.5, fontReg, DARK)

  // ── line items table ─────────────────────────────────────────────────────
  const tableTop = 175
  // header row
  rect(L, tableTop, CONTENT_W, 22, DARK)
  t('Description',  L + 8,              tableTop + 14, 8.5, fontBold, WHITE)
  tr('Qty',         L + CONTENT_W * 0.72, tableTop + 14, 8.5, fontBold, WHITE)
  tr('Unit Price',  L + CONTENT_W * 0.86, tableTop + 14, 8.5, fontBold, WHITE)
  tr('Amount',      R - 6,               tableTop + 14, 8.5, fontBold, WHITE)

  let rowY = tableTop + 22
  const ROW_H = 20

  data.items.forEach((item, idx) => {
    if (idx % 2 === 1) rect(L, rowY, CONTENT_W, ROW_H, LIGHT)
    t(item.description,                   L + 8,              rowY + 13, 8.5, fontReg,  DARK)
    tr(String(item.quantity),             L + CONTENT_W * 0.72, rowY + 13, 8.5, fontReg,  DARK)
    tr(fmt(item.unitPrice),              L + CONTENT_W * 0.86, rowY + 13, 8.5, fontReg,  DARK)
    tr(fmt(item.amount),                 R - 6,               rowY + 13, 8.5, fontBold, DARK)
    rowY += ROW_H
  })

  // ── totals block ─────────────────────────────────────────────────────────
  const totalsX = L + CONTENT_W * 0.6
  const totalsW = CONTENT_W * 0.4
  rowY += 10

  if (data.vatAmount > 0) {
    t('Subtotal',   totalsX + 6,  rowY + 13, 8.5, fontReg, MID)
    tr(fmt(data.subtotal), R - 6, rowY + 13, 8.5, fontReg, DARK)
    rowY += ROW_H
    t('VAT',        totalsX + 6,  rowY + 13, 8.5, fontReg, MID)
    tr(fmt(data.vatAmount), R - 6, rowY + 13, 8.5, fontReg, DARK)
    rowY += ROW_H
    line(totalsX, rowY, R, rowY, DARK, 0.4)
    rowY += 4
  }

  rect(totalsX, rowY, totalsW, ROW_H + 4, DARK)
  t('TOTAL',           totalsX + 6, rowY + 15, 9,  fontBold, WHITE)
  tr(fmt(data.totalAmount), R - 6,  rowY + 15, 9,  fontBold, WHITE)

  // ── payment note ─────────────────────────────────────────────────────────
  rowY += ROW_H + 24
  line(L, rowY, R, rowY, ACCENT, 1.5)
  rowY += 10
  t(`Payment due by ${fmtDate(data.dueDate)}.  Please reference ${data.invoiceNumber} when making payment.`,
    L, rowY + 12, 8.5, fontReg, MID)

  // ── footer ───────────────────────────────────────────────────────────────
  line(L, height - 45, R, height - 45, MID, 0.4)
  t(ourName, L, height - 31, 8, fontReg, MID)

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
