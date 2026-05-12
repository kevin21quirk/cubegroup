import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const formats = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  }
  
  return new Intl.DateTimeFormat('en-GB', formats[format] as any).format(d)
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${year}${month}-${random}`
}

export function calculateVAT(amount: number, vatRate: number = 20): number {
  return (amount * vatRate) / 100
}

export function parsePayrollWeek(weekString: string): { start: Date; end: Date } | null {
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})\s*to\s*(\d{4})-(\d{2})-(\d{2})/i,
    /week\s*(\d+)\s*(\d{4})/i,
  ]
  
  for (const pattern of patterns) {
    const match = weekString.match(pattern)
    if (match) {
      if (pattern === patterns[0]) {
        const start = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]))
        const end = new Date(parseInt(match[6]), parseInt(match[5]) - 1, parseInt(match[4]))
        return { start, end }
      } else if (pattern === patterns[1]) {
        const start = new Date(match[1])
        const end = new Date(match[4])
        return { start, end }
      } else if (pattern === patterns[2]) {
        const weekNum = parseInt(match[1])
        const year = parseInt(match[2])
        const start = new Date(year, 0, 1 + (weekNum - 1) * 7)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)
        return { start, end }
      }
    }
  }
  
  return null
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
  }
  
  return mimeTypes[extension] || 'application/octet-stream'
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
