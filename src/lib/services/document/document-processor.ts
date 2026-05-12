import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'
import { DocumentType, DocumentExtractionResult } from '@/types'
import { getAIProvider } from '../ai'

export class DocumentProcessor {
  async processDocument(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<DocumentExtractionResult> {
    try {
      const text = await this.extractText(buffer, mimeType)
      
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'No text could be extracted from document',
        }
      }

      const aiProvider = getAIProvider()
      const result = await aiProvider.extractPayrollData(text)
      
      return {
        ...result,
        rawText: text,
      }
    } catch (error) {
      console.error('Document processing error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case 'application/pdf':
        return this.extractFromPDF(buffer)
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return this.extractFromWord(buffer)
      
      case 'image/png':
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/gif':
        return this.extractFromImage(buffer)
      
      case 'text/plain':
        return buffer.toString('utf-8')
      
      default:
        throw new Error(`Unsupported document type: ${mimeType}`)
    }
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer)
    return data.text
  }

  private async extractFromWord(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  private async extractFromImage(buffer: Buffer): Promise<string> {
    const worker = await createWorker('eng')
    const { data } = await worker.recognize(buffer)
    await worker.terminate()
    return data.text
  }

  async extractFromExcel(buffer: Buffer): Promise<any[]> {
    throw new Error('Excel extraction not yet implemented')
  }

  async extractFromCSV(buffer: Buffer): Promise<any[]> {
    const text = buffer.toString('utf-8')
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const data = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index]
      })
      
      data.push(row)
    }
    
    return data
  }
}
