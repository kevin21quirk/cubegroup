import ExcelJS from 'exceljs'
import { PayrollEntryData, SpreadsheetGenerationOptions } from '@/types'

export class SpreadsheetGenerator {
  async generatePayrollSpreadsheet(
    entries: PayrollEntryData[],
    options: SpreadsheetGenerationOptions
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Payroll')

    worksheet.columns = [
      { header: 'Worker Name', key: 'workerName', width: 25 },
      { header: 'Hours Worked', key: 'hoursWorked', width: 15 },
      { header: 'Hourly Rate', key: 'hourlyRate', width: 15 },
      { header: 'Gross Pay', key: 'grossPay', width: 15 },
      { header: 'Cube Fee', key: 'cubeFee', width: 15 },
      { header: 'Umbrella Fee', key: 'umbrellaFee', width: 15 },
      { header: 'Umbrella Company', key: 'umbrellaCompany', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ]

    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    }
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true }

    entries.forEach((entry) => {
      worksheet.addRow({
        workerName: entry.workerName,
        hoursWorked: entry.hoursWorked,
        hourlyRate: entry.hourlyRate,
        grossPay: entry.grossPay,
        cubeFee: entry.cubeFee,
        umbrellaFee: entry.umbrellaFee,
        umbrellaCompany: entry.umbrellaCompany,
        department: entry.department || '',
        notes: entry.notes || '',
      })
    })

    const lastRow = worksheet.rowCount + 2
    worksheet.getCell(`A${lastRow}`).value = 'TOTALS'
    worksheet.getCell(`A${lastRow}`).font = { bold: true }
    
    if (options.includeFormulas) {
      worksheet.getCell(`B${lastRow}`).value = { 
        formula: `SUM(B2:B${lastRow - 2})` 
      }
      worksheet.getCell(`D${lastRow}`).value = { 
        formula: `SUM(D2:D${lastRow - 2})` 
      }
      worksheet.getCell(`E${lastRow}`).value = { 
        formula: `SUM(E2:E${lastRow - 2})` 
      }
      worksheet.getCell(`F${lastRow}`).value = { 
        formula: `SUM(F2:F${lastRow - 2})` 
      }
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell, colNumber) => {
          if (colNumber >= 2 && colNumber <= 6) {
            cell.numFmt = '£#,##0.00'
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  async populateTemplate(
    templatePath: string,
    data: any
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(templatePath)
    
    throw new Error('Template population not yet implemented')
  }

  async generateCSV(entries: PayrollEntryData[]): Promise<string> {
    const headers = [
      'Worker Name',
      'Hours Worked',
      'Hourly Rate',
      'Gross Pay',
      'Cube Fee',
      'Umbrella Fee',
      'Umbrella Company',
      'Department',
      'Notes',
    ]

    const rows = entries.map(entry => [
      entry.workerName,
      entry.hoursWorked,
      entry.hourlyRate,
      entry.grossPay,
      entry.cubeFee,
      entry.umbrellaFee,
      entry.umbrellaCompany,
      entry.department || '',
      entry.notes || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    return csv
  }
}
