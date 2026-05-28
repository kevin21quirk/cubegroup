/**
 * FileReaderService – reads XLSX, CSV, PDF, DOCX and image attachments
 * and converts them into structured text/JSON ready for AI extraction.
 */
import ExcelJS from 'exceljs'
import fs from 'fs/promises'
import path from 'path'

export interface FileContent {
  text: string           // flat text representation
  rows?: string[][]      // structured rows for spreadsheet/CSV
  mimeType: string
  documentType: string
  filename: string
}

export class FileReaderService {

  async readFile(filePath: string, mimeType: string, filename: string): Promise<FileContent> {
    const ext = path.extname(filename).toLowerCase()
    const docType = this.detectDocType(ext, mimeType)

    switch (docType) {
      case 'CSV':  return this.readCsv(filePath, filename)
      case 'XLSX': return this.readXlsx(filePath, filename)
      case 'PDF':  return this.readPdf(filePath, filename)
      case 'DOCX': return this.readDocx(filePath, filename)
      case 'IMAGE':return this.readImage(filePath, mimeType, filename)
      default:     return this.readPlainText(filePath, filename)
    }
  }

  // ── CSV ────────────────────────────────────────────────────────────────────
  private async readCsv(filePath: string, filename: string): Promise<FileContent> {
    const raw = await fs.readFile(filePath, 'utf-8')
    const lines = raw.split('\n').filter(l => l.trim())
    const rows = lines.map(l => l.split(',').map(c => c.replace(/^"|"$/g, '').trim()))
    return { text: raw.slice(0, 8000), rows, mimeType: 'text/csv', documentType: 'CSV', filename }
  }

  // ── XLSX ───────────────────────────────────────────────────────────────────
  private async readXlsx(filePath: string, filename: string): Promise<FileContent> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const rows: string[][] = []
    let text = ''

    workbook.eachSheet(ws => {
      text += `\n=== Sheet: ${ws.name} ===\n`
      ws.eachRow(row => {
        const cells = (row.values as ExcelJS.CellValue[])
          .slice(1) // ExcelJS row.values is 1-indexed with undefined at [0]
          .map(v => (v === null || v === undefined) ? '' : String(v))
        rows.push(cells)
        text += cells.join('\t') + '\n'
      })
    })

    return { text: text.slice(0, 12000), rows, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', documentType: 'XLSX', filename }
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  private async readPdf(filePath: string, filename: string): Promise<FileContent> {
    try {
      // Dynamic import to avoid build-time issues
      const pdfParse = (await import('pdf-parse')).default
      const buffer = await fs.readFile(filePath)
      const data = await pdfParse(buffer)
      return { text: data.text.slice(0, 12000), mimeType: 'application/pdf', documentType: 'PDF', filename }
    } catch {
      return { text: '[PDF could not be parsed]', mimeType: 'application/pdf', documentType: 'PDF', filename }
    }
  }

  // ── DOCX ───────────────────────────────────────────────────────────────────
  private async readDocx(filePath: string, filename: string): Promise<FileContent> {
    try {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ path: filePath })
      return { text: result.value.slice(0, 12000), mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', documentType: 'DOCX', filename }
    } catch {
      return { text: '[DOCX could not be parsed]', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', documentType: 'DOCX', filename }
    }
  }

  // ── Image – return base64 for Claude vision ────────────────────────────────
  async readImageAsBase64(filePath: string): Promise<{ base64: string; mediaType: string }> {
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mediaTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
    }
    return { base64: buffer.toString('base64'), mediaType: mediaTypeMap[ext] || 'image/jpeg' }
  }

  private async readImage(filePath: string, mimeType: string, filename: string): Promise<FileContent> {
    const buffer = await fs.readFile(filePath)
    return { text: `[Image attachment: ${filename} – will be analysed with vision]`, mimeType, documentType: 'IMAGE', filename, rows: [[buffer.toString('base64')]] }
  }

  private async readPlainText(filePath: string, filename: string): Promise<FileContent> {
    const text = await fs.readFile(filePath, 'utf-8').catch(() => '[Could not read file]')
    return { text: text.slice(0, 8000), mimeType: 'text/plain', documentType: 'OTHER', filename }
  }

  private detectDocType(ext: string, mimeType: string): string {
    if (ext === '.csv' || mimeType === 'text/csv') return 'CSV'
    if (['.xlsx', '.xls'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLSX'
    if (ext === '.pdf' || mimeType === 'application/pdf') return 'PDF'
    if (ext === '.docx' || mimeType.includes('wordprocessingml')) return 'DOCX'
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'].includes(ext) || mimeType.startsWith('image/')) return 'IMAGE'
    return 'OTHER'
  }
}

let fileReaderService: FileReaderService | null = null
export function getFileReaderService(): FileReaderService {
  if (!fileReaderService) fileReaderService = new FileReaderService()
  return fileReaderService
}
