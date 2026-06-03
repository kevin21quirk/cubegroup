/**
 * Shared CSV / XLSX row parser for import API routes.
 * Returns an array of plain objects where keys are normalised column headers.
 *
 * Normalisation: lowercase + strip all non-alphanumeric characters.
 * "Company Name" → "companyname"  |  "billing address" → "billingaddress"
 */
import ExcelJS from 'exceljs'

export type ParsedRow = Record<string, string>

/** Normalise a header string for consistent map lookup */
export function normHeader(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current  = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCsvText(text: string): ParsedRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(normHeader)
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: ParsedRow = {}
    headers.forEach((h, idx) => { if (h) row[h] = (values[idx] ?? '').trim() })
    if (Object.values(row).some(v => v !== '')) rows.push(row)
  }

  return rows
}

// ── XLSX ──────────────────────────────────────────────────────────────────────

async function parseXlsxBuffer(buffer: Buffer): Promise<ParsedRow[]> {
  const workbook  = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])

  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const headers: string[] = []
  const rows: ParsedRow[] = []

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: false }, cell => {
        headers.push(normHeader(String(cell.value ?? '')))
      })
    } else {
      const obj: ParsedRow = {}
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (!header) return

        const val = cell.value
        if (val instanceof Date) {
          obj[header] = val.toISOString().split('T')[0]            // YYYY-MM-DD
        } else if (val !== null && val !== undefined) {
          obj[header] = String(val).trim()
        } else {
          obj[header] = ''
        }
      })
      if (Object.values(obj).some(v => v !== '')) rows.push(obj)
    }
  })

  return rows
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseFile(file: File): Promise<ParsedRow[]> {
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const name   = file.name.toLowerCase()

  if (name.endsWith('.csv') || file.type.includes('csv') || file.type === 'text/plain') {
    return parseCsvText(buffer.toString('utf-8'))
  }
  return parseXlsxBuffer(buffer)
}
