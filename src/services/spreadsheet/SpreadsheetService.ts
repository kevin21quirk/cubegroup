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

// ─── Weekly Payroll template column definitions ───────────────────────────────
// Sheet 1 – matches the exact template headings from Image 1
const PAYROLL_SHEET1_COLS: Partial<ExcelJS.Column>[] = [
  { header: 'Employee ID / NI Number', key: 'employeeId',   width: 22 },
  { header: 'First Name',              key: 'firstName',    width: 15 },
  { header: 'Last Name',               key: 'lastName',     width: 15 },
  { header: 'New Starter (Y/N)',        key: 'newStarter',   width: 16 },
  { header: 'Start Date',              key: 'startDate',    width: 14 },
  { header: 'Leaver (Y/N)',            key: 'leaver',       width: 13 },
  { header: 'Hours Worked',            key: 'hoursWorked',  width: 14 },
  { header: 'Hourly Rate',             key: 'hourlyRate',   width: 13 },
  { header: 'Basic Pay',               key: 'basicPay',     width: 13 },
  { header: 'Overtime Hours',          key: 'overtimeHours',width: 15 },
  { header: 'Overtime Rate',           key: 'overtimeRate', width: 14 },
  { header: 'Overtime Pay',            key: 'overtimePay',  width: 14 },
  { header: 'Holiday Hours',           key: 'holidayHours', width: 14 },
  { header: 'Holiday Pay',             key: 'holidayPay',   width: 13 },
  { header: 'Statutory Pay (SSP/SMP/etc)', key: 'statutoryPay', width: 24 },
  { header: 'Total Gross Pay',         key: 'totalGrossPay',width: 16 },
]

// Sheet 2 – matches the exact headings from Image 5
const PAYROLL_SHEET2_COLS: Partial<ExcelJS.Column>[] = [
  { header: 'Employee ID / NI Number',                 key: 'employeeId',   width: 22 },
  { header: 'First Name',                              key: 'firstName',    width: 15 },
  { header: 'Last Name',                               key: 'lastName',     width: 15 },
  { header: 'Change Type (Starter/Leaver/Amendment)',  key: 'changeType',   width: 36 },
  { header: 'Effective Date',                          key: 'effectiveDate',width: 16 },
  { header: 'New Rate of Pay',                         key: 'newRateOfPay', width: 16 },
  { header: 'New Job Title',                           key: 'newJobTitle',  width: 20 },
  { header: 'Notes',                                   key: 'notes',        width: 30 },
]

// CIS Transaction Import headers (Image 2)
export const CIS_TRANSACTION_HEADERS = [
  'Subcontractor',
  'Gross pay',
  'Cost of materials',
  'VAT',
  'Gross for CIS deduction',
  'CIS deduction',
  'Net pay',
  'Cost to contractor',
]

// Contractor Import Template headers (Image 3 – full list supplied by user)
export const CONTRACTOR_IMPORT_HEADERS = [
  'Title', 'First Name', 'Middle Names', 'Surname', 'Gender', 'Date of Birth',
  'Nationality', 'NI Number', 'Address Line 1', 'Address 2', 'Address 3', 'Town',
  'County', 'Living Country', 'Post Code', 'Mobile', 'Phone', 'Email Address',
  'Name on Bank Account', 'Bank Name', 'Account No.', 'Sort Code', 'Building Society No',
  'Non UK Bank', 'Third Party Bank Account', '3RD party Account name',
  '3RD party Address 1', '3RD party Town', '3RD party postcode', '3RD party country',
  '3RD party Relationship', '3RD party contact no.', '3RD party DOB',
  'Starter Declaration', 'P45 Gross for Tax', 'P45 Tax Deducted', 'Start Date',
  'Pay Frequency', 'NI Category', 'Tax Code', 'Tax Basis', 'PRODUCT >>>>>>',
  'Agency', 'Branch', 'Holiday Pay Rule', 'Apply Holiday Employment Costs',
  'Derogation Contract', 'Derogation Spread', 'Service Used', 'PAYE Amount',
  'Payment Terms', 'Payment Method', 'Agency Ref', 'Job Description', 'Loan Plan',
  'status', 'Pension Applicable', 'Apprenticeship Levy', 'GDPR',
  'Minimum Margin Charge', 'Agency Margin Rule',
]

// CIS Subcontractor Import headers (Image 4)
export const CIS_SUBCONTRACTOR_HEADERS = [
  'TradingName', 'Subcontractor Name', 'Name', 'Middle Name', 'Surname',
  'Works Number', 'Address Line 1', 'Address Line 2', 'Address Line 3',
  'Address Line 4', 'Postcode', 'Email Address', 'Phone Number', 'Department',
  'Company Type', 'Company Reference', 'Unique Tax', 'National Insurance',
  'Is VAT Registered', 'VAT Number', 'Verification Number',
]

export class SpreadsheetService {
  async generatePayrollSpreadsheet(
    data: NormalizedPayrollData[],
    companyName: string,
    payrollWeek: string,
    changes?: Array<{
      employeeId?: string; firstName?: string; lastName?: string
      changeType: string; effectiveDate?: Date; newRateOfPay?: number
      newJobTitle?: string; notes?: string
    }>
  ): Promise<SpreadsheetGenerationResult> {
    try {
      const workbook = new ExcelJS.Workbook()

      // ── Sheet 1: Weekly Payroll ──────────────────────────────────────────────
      const ws1 = workbook.addWorksheet('Payroll')

      // Row 1 – company header
      ws1.getCell('A1').value = companyName
      ws1.getCell('A1').font = { bold: true, size: 12 }
      ws1.getCell('B1').value = 'Week Ending'
      ws1.getCell('B1').font = { bold: true }
      ws1.getCell('C1').value = payrollWeek
      ws1.getCell('C1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }

      // Row 2 – blank
      // Row 3 – column headers
      ws1.columns = PAYROLL_SHEET1_COLS
      const headerRow = ws1.getRow(3)
      PAYROLL_SHEET1_COLS.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1)
        cell.value = col.header as string
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
        cell.alignment = { horizontal: 'center', wrapText: true }
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        }
      })
      headerRow.height = 30

      // Data rows start at row 4
      const currencyFmt = '£#,##0.00'
      const numFmt = '#,##0.00'
      let dataStartRow = 4

      data.forEach((entry, idx) => {
        const rowNum = dataStartRow + idx
        const row = ws1.getRow(rowNum)
        row.values = [
          entry.niNumber || entry.workerName,
          entry.firstName || '',
          entry.lastName || entry.workerName,
          entry.isNewStarter ? 'Y' : 'N',
          entry.startDate ? new Date(entry.startDate) : '',
          entry.isLeaver ? 'Y' : 'N',
          entry.hoursWorked,
          entry.hourlyRate,
          entry.basicPay ?? entry.grossPay,
          entry.overtimeHours ?? 0,
          entry.overtimeRate ?? 0,
          entry.overtimePay ?? 0,
          entry.holidayHours ?? 0,
          entry.holidayPay ?? 0,
          entry.statutoryPay ?? 0,
          entry.totalGrossPay ?? entry.grossPay,
        ]
        // Format numeric columns
        ;[7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(col => {
          row.getCell(col).numFmt = col <= 6 ? numFmt : currencyFmt
        })
        row.getCell(5).numFmt = 'dd/mm/yyyy'
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
          }
        })
      })

      // Totals row
      const totalsRowNum = dataStartRow + data.length
      const tr = ws1.getRow(totalsRowNum)
      const lastDataRow = totalsRowNum - 1
      tr.getCell(1).value = 'TOTAL'
      tr.getCell(1).font = { bold: true }
      // SUM formulas for numeric columns
      const sumCols = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
      sumCols.forEach(col => {
        const colLetter = ws1.getColumn(col).letter
        tr.getCell(col).value = { formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${lastDataRow})` }
        tr.getCell(col).numFmt = col >= 8 ? currencyFmt : numFmt
        tr.getCell(col).font = { bold: true }
      })

      // ── Sheet 2: Starters / Leavers / Amendments ────────────────────────────
      const ws2 = workbook.addWorksheet('Starters & Leavers')
      ws2.columns = PAYROLL_SHEET2_COLS
      const hdr2 = ws2.getRow(1)
      PAYROLL_SHEET2_COLS.forEach((col, i) => {
        const cell = hdr2.getCell(i + 1)
        cell.value = col.header as string
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
        cell.alignment = { horizontal: 'center', wrapText: true }
      })
      hdr2.height = 30

      if (changes && changes.length > 0) {
        changes.forEach((c, idx) => {
          const row = ws2.getRow(2 + idx)
          row.values = [
            c.employeeId || '',
            c.firstName || '',
            c.lastName || '',
            c.changeType,
            c.effectiveDate ? new Date(c.effectiveDate) : '',
            c.newRateOfPay ?? '',
            c.newJobTitle || '',
            c.notes || '',
          ]
          if (c.effectiveDate) row.getCell(5).numFmt = 'dd/mm/yyyy'
          if (c.newRateOfPay)  row.getCell(6).numFmt = currencyFmt
        })
      } else {
        // Auto-populate changes from data (new starters / leavers)
        let changeRow = 2
        data.forEach(entry => {
          if (entry.isNewStarter || entry.isLeaver) {
            const row = ws2.getRow(changeRow++)
            row.values = [
              entry.niNumber || entry.workerName,
              entry.firstName || '',
              entry.lastName || entry.workerName,
              entry.isNewStarter ? 'Starter' : 'Leaver',
              entry.startDate ? new Date(entry.startDate) : '',
              entry.hourlyRate ?? '',
              entry.jobTitle || '',
              '',
            ]
          }
        })
      }

      // Save file
      const filename = this.generateFilename(companyName, payrollWeek)
      const outputPath = path.join(process.cwd(), 'temp', filename)
      await fs.mkdir(path.dirname(outputPath), { recursive: true })
      await workbook.xlsx.writeFile(outputPath)

      return { success: true, filePath: outputPath, filename }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Spreadsheet generation failed',
      }
    }
  }

  // ── CIS Transaction Import CSV (Image 2) ────────────────────────────────────
  generateCisTransactionCsv(transactions: Array<{
    subcontractorName: string
    grossPay: number
    costOfMaterials: number
    vat: number
    grossForCisDeduction: number
    cisDeduction: number
    netPay: number
    costToContractor: number
  }>): string {
    const rows = transactions.map(t => [
      this.csvEscape(t.subcontractorName),
      t.grossPay.toFixed(2),
      t.costOfMaterials.toFixed(2),
      t.vat.toFixed(2),
      t.grossForCisDeduction.toFixed(2),
      t.cisDeduction.toFixed(2),
      t.netPay.toFixed(2),
      t.costToContractor.toFixed(2),
    ])
    return [CIS_TRANSACTION_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  }

  // ── Contractor Import CSV (Image 3) ─────────────────────────────────────────
  generateContractorImportCsv(workers: Array<Record<string, any>>): string {
    const rows = workers.map(w => CONTRACTOR_IMPORT_HEADERS.map(h => {
      const fieldMap: Record<string, string> = {
        'Title': 'title', 'First Name': 'firstName', 'Middle Names': 'middleNames',
        'Surname': 'lastName', 'Gender': 'gender', 'Date of Birth': 'dateOfBirth',
        'Nationality': 'nationality', 'NI Number': 'nationalInsurance',
        'Address Line 1': 'addressLine1', 'Address 2': 'addressLine2',
        'Address 3': 'addressLine3', 'Town': 'town', 'County': 'county',
        'Living Country': 'livingCountry', 'Post Code': 'postCode',
        'Mobile': 'mobile', 'Phone': 'phone', 'Email Address': 'email',
        'Name on Bank Account': 'nameOnBankAccount', 'Bank Name': 'bankName',
        'Account No.': 'bankAccountNumber', 'Sort Code': 'bankSortCode',
        'Building Society No': 'buildingSocietyNo',
        'Non UK Bank': 'nonUkBank',
        'Third Party Bank Account': 'thirdPartyBankAccount',
        '3RD party Account name': 'thirdPartyAccountName',
        '3RD party Address 1': 'thirdPartyAddress1',
        '3RD party Town': 'thirdPartyTown',
        '3RD party postcode': 'thirdPartyPostcode',
        '3RD party country': 'thirdPartyCountry',
        '3RD party Relationship': 'thirdPartyRelationship',
        '3RD party contact no.': 'thirdPartyContactNo',
        '3RD party DOB': 'thirdPartyDob',
        'Starter Declaration': 'starterDeclaration',
        'P45 Gross for Tax': 'p45GrossForTax',
        'P45 Tax Deducted': 'p45TaxDeducted',
        'Start Date': 'startDate',
        'Pay Frequency': 'payFrequency',
        'NI Category': 'niCategory',
        'Tax Code': 'taxCode',
        'Tax Basis': 'taxBasis',
        'PRODUCT >>>>>>': 'product',
        'Agency': 'agency', 'Branch': 'branch',
        'Holiday Pay Rule': 'holidayPayRule',
        'Apply Holiday Employment Costs': 'applyHolidayEmploymentCosts',
        'Derogation Contract': 'derogationContract',
        'Derogation Spread': 'derogationSpread',
        'Service Used': 'serviceUsed',
        'PAYE Amount': 'payeAmount',
        'Payment Terms': 'paymentTerms',
        'Payment Method': 'paymentMethod',
        'Agency Ref': 'agencyRef',
        'Job Description': 'jobDescription',
        'Loan Plan': 'loanPlan',
        'status': 'isActive',
        'Pension Applicable': 'pensionApplicable',
        'Apprenticeship Levy': 'apprenticeshipLevy',
        'GDPR': 'gdpr',
        'Minimum Margin Charge': 'minimumMarginCharge',
        'Agency Margin Rule': 'agencyMarginRule',
      }
      const dbField = fieldMap[h]
      const val = dbField ? w[dbField] : ''
      if (val === null || val === undefined) return ''
      if (val instanceof Date) return val.toISOString().split('T')[0]
      if (typeof val === 'boolean') return val ? 'Yes' : 'No'
      return this.csvEscape(String(val))
    }))
    return [CONTRACTOR_IMPORT_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  }

  // ── CIS Subcontractor Import CSV (Image 4) ───────────────────────────────────
  generateCisSubcontractorCsv(subs: Array<Record<string, any>>): string {
    const rows = subs.map(s => [
      this.csvEscape(s.tradingName || ''),
      this.csvEscape(s.subcontractorName || ''),
      this.csvEscape(s.firstName || ''),
      this.csvEscape(s.middleName || ''),
      this.csvEscape(s.surname || ''),
      this.csvEscape(s.worksNumber || ''),
      this.csvEscape(s.addressLine1 || ''),
      this.csvEscape(s.addressLine2 || ''),
      this.csvEscape(s.addressLine3 || ''),
      this.csvEscape(s.addressLine4 || ''),
      this.csvEscape(s.postcode || ''),
      this.csvEscape(s.emailAddress || ''),
      this.csvEscape(s.phoneNumber || ''),
      this.csvEscape(s.department || ''),
      this.csvEscape(s.companyType || ''),
      this.csvEscape(s.companyReference || ''),
      this.csvEscape(s.utrNumber || ''),
      this.csvEscape(s.nationalInsurance || ''),
      s.isVatRegistered ? 'Yes' : 'No',
      this.csvEscape(s.vatNumber || ''),
      this.csvEscape(s.verificationNumber || ''),
    ])
    return [CIS_SUBCONTRACTOR_HEADERS.join(','), ...rows.map(r => r.join(','))].join('\r\n')
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private generateFilename(companyName: string, payrollWeek: string): string {
    const clean = companyName.replace(/[^a-zA-Z0-9]/g, '_')
    const dateMatch = payrollWeek.match(/\d{4}-\d{2}-\d{2}/)
    const dateStr = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0]
    return `${clean}_WeekEnding_${dateStr}.xlsx`
  }
}

let spreadsheetService: SpreadsheetService | null = null

export function getSpreadsheetService(): SpreadsheetService {
  if (!spreadsheetService) spreadsheetService = new SpreadsheetService()
  return spreadsheetService
}
