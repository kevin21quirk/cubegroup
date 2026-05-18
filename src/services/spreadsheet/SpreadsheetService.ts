import ExcelJS from 'exceljs'
import { NormalizedPayrollData } from '@/types/payroll'
import path from 'path'
import fs from 'fs/promises'

export interface SpreadsheetGenerationResult {
  success: boolean
  filePath?: string
  filename?: string
  error?: string
}

export class SpreadsheetService {
  private templatePath: string

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(process.cwd(), 'templates', 'payroll-template.xlsx')
  }

  async generatePayrollSpreadsheet(
    data: NormalizedPayrollData[],
    companyName: string,
    payrollWeek: string
  ): Promise<SpreadsheetGenerationResult> {
    try {
      const workbook = new ExcelJS.Workbook()
      
      // Try to load template if it exists, otherwise create new workbook
      try {
        await workbook.xlsx.readFile(this.templatePath)
      } catch {
        // Template doesn't exist, create from scratch
        this.createDefaultTemplate(workbook)
      }

      const worksheet = workbook.getWorksheet(1) || workbook.addWorksheet('Payroll')
      
      // Populate data
      this.populateWorksheet(worksheet, data)
      
      // Generate filename
      const filename = this.generateFilename(companyName, payrollWeek)
      const outputPath = path.join(process.cwd(), 'temp', filename)
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true })
      
      // Save workbook
      await workbook.xlsx.writeFile(outputPath)

      return {
        success: true,
        filePath: outputPath,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Spreadsheet generation failed'
      }
    }
  }

  private createDefaultTemplate(workbook: ExcelJS.Workbook): void {
    const worksheet = workbook.addWorksheet('Payroll')
    
    // Define headers
    const headers = [
      'Worker Name',
      'Hours Worked',
      'Hourly Rate',
      'Gross Pay',
      'Umbrella Company',
      'Department',
      'Site',
      'Notes'
    ]
    
    // Add header row
    const headerRow = worksheet.addRow(headers)
    
    // Style header row
    headerRow.font = { bold: true, size: 12 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    
    // Set column widths
    worksheet.columns = [
      { width: 25 }, // Worker Name
      { width: 15 }, // Hours Worked
      { width: 15 }, // Hourly Rate
      { width: 15 }, // Gross Pay
      { width: 20 }, // Umbrella Company
      { width: 20 }, // Department
      { width: 20 }, // Site
      { width: 30 }  // Notes
    ]
  }

  private populateWorksheet(worksheet: ExcelJS.Worksheet, data: NormalizedPayrollData[]): void {
    // Find the data start row (after headers)
    let startRow = 2
    
    // Check if template has headers
    const firstRow = worksheet.getRow(1)
    if (firstRow.values && Array.isArray(firstRow.values) && firstRow.values.length > 1) {
      startRow = 2
    } else {
      // Add headers if not present
      worksheet.getRow(1).values = [
        'Worker Name',
        'Hours Worked',
        'Hourly Rate',
        'Gross Pay',
        'Umbrella Company',
        'Department',
        'Site',
        'Notes'
      ]
      startRow = 2
    }

    // Add data rows
    data.forEach((entry, index) => {
      const row = worksheet.getRow(startRow + index)
      row.values = [
        entry.workerName,
        entry.hoursWorked,
        entry.hourlyRate,
        entry.grossPay,
        entry.umbrellaCompany,
        entry.department,
        entry.site,
        entry.notes
      ]
      
      // Format currency columns
      row.getCell(3).numFmt = '£#,##0.00'
      row.getCell(4).numFmt = '£#,##0.00'
    })

    // Add totals row
    const totalsRow = worksheet.getRow(startRow + data.length)
    const totalHours = data.reduce((sum, entry) => sum + entry.hoursWorked, 0)
    const totalGross = data.reduce((sum, entry) => sum + entry.grossPay, 0)
    
    totalsRow.values = [
      'TOTAL',
      totalHours,
      '',
      totalGross,
      '',
      '',
      '',
      ''
    ]
    totalsRow.font = { bold: true }
    totalsRow.getCell(4).numFmt = '£#,##0.00'
  }

  private generateFilename(companyName: string, payrollWeek: string): string {
    // Clean company name
    const cleanCompany = companyName.replace(/[^a-zA-Z0-9]/g, '_')
    
    // Extract or format date
    const dateMatch = payrollWeek.match(/\d{4}-\d{2}-\d{2}/)
    const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0]
    
    return `${cleanCompany}_WeekEnding_${dateStr}.xlsx`
  }

  async loadTemplate(templatePath: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    return workbook
  }
}

// Singleton instance
let spreadsheetService: SpreadsheetService | null = null

export function getSpreadsheetService(): SpreadsheetService {
  if (!spreadsheetService) {
    spreadsheetService = new SpreadsheetService()
  }
  return spreadsheetService
}
