import { AIExtractionResult, NormalizedPayrollData } from '@/types/payroll'
import Anthropic from '@anthropic-ai/sdk'

export interface WorkerExtractionData {
  // Contractor import template fields extracted from the document
  title?: string; firstName?: string; middleNames?: string; lastName?: string
  gender?: string; dateOfBirth?: string; nationality?: string
  nationalInsurance?: string; niCategory?: string
  mobile?: string; phone?: string; email?: string
  addressLine1?: string; addressLine2?: string; addressLine3?: string
  town?: string; county?: string; livingCountry?: string; postCode?: string
  nameOnBankAccount?: string; bankName?: string
  bankAccountNumber?: string; bankSortCode?: string
  startDate?: string; payFrequency?: string; taxCode?: string; taxBasis?: string
  starterDeclaration?: string; p45GrossForTax?: number; p45TaxDeducted?: number
  product?: string; agency?: string; branch?: string; agencyRef?: string
  jobDescription?: string; utrNumber?: string; cisStatus?: string
  tradingName?: string; contractorType?: string
  pensionApplicable?: boolean; apprenticeshipLevy?: boolean
}

export interface CompanyExtractionData {
  name?: string
  tradingName?: string
  companyNumber?: string
  vatNumber?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  contactName?: string
}

export interface FullExtractionResult {
  success: boolean
  documentType: 'TIMESHEET' | 'INVOICE' | 'CONTRACTOR_REGISTRATION' | 'WORKER_LIST' | 'COMPANY_INFO' | 'CIS' | 'MIXED' | 'UNKNOWN'
  payrollEntries: NormalizedPayrollData[]
  workerData: WorkerExtractionData[]
  companyData?: CompanyExtractionData
  confidence: number
  rawResponse?: string
  error?: string
}

export class AIExtractionService {
  private anthropic: Anthropic

  private static readonly FALLBACK_MODELS = [
    'claude-sonnet-4-5',
    'claude-haiku-4-5',
    'claude-sonnet-4-6',
    'claude-opus-4-5',
  ]

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    this.anthropic = new Anthropic({ apiKey })
  }

  private getModel(): string {
    return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'
  }

  private async callWithFallback(params: Omit<Parameters<typeof this.anthropic.messages.create>[0], 'model'>) {
    const primary = this.getModel()
    const models = [primary, ...AIExtractionService.FALLBACK_MODELS.filter(m => m !== primary)]
    let lastError: unknown
    for (const model of models) {
      try {
        return await this.anthropic.messages.create({ ...params, model } as any)
      } catch (e: any) {
        if (e?.status === 404 || e?.message?.includes('not_found')) {
          lastError = e
          continue
        }
        throw e
      }
    }
    throw lastError
  }

  // ── Main extraction – text-based attachments ──────────────────────────────
  async extractFromText(content: string, fileType: string): Promise<FullExtractionResult> {
    try {
      const message = await this.callWithFallback({
        max_tokens: 8096,
        temperature: 0.1,
        system: this.getSystemPrompt(),
        messages: [{ role: 'user', content: this.buildTextPrompt(content, fileType) }],
      })
      return this.parseResponse(message)
    } catch (error) {
      return { success: false, documentType: 'UNKNOWN', payrollEntries: [], workerData: [], confidence: 0, error: error instanceof Error ? error.message : 'AI extraction failed' }
    }
  }

  // ── Vision extraction – image attachments ─────────────────────────────────
  async extractFromImage(base64: string, mediaType: string): Promise<FullExtractionResult> {
    try {
      const message = await this.callWithFallback({
        max_tokens: 8096,
        temperature: 0.1,
        system: this.getSystemPrompt(),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
            { type: 'text', text: 'Analyse this payroll/invoice/contractor document image and extract all data per the system prompt. Return ONLY valid JSON.' },
          ],
        }],
      })
      return this.parseResponse(message)
    } catch (error) {
      return { success: false, documentType: 'UNKNOWN', payrollEntries: [], workerData: [], confidence: 0, error: error instanceof Error ? error.message : 'AI vision extraction failed' }
    }
  }

  // ── Legacy compatibility ───────────────────────────────────────────────────
  async extractPayrollData(content: string, fileType: string): Promise<AIExtractionResult> {
    const result = await this.extractFromText(content, fileType)
    return { success: result.success, data: result.payrollEntries, confidence: result.confidence, rawResponse: result.rawResponse, error: result.error }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private getSystemPrompt(): string {
    return `You are an expert payroll and contractor data extraction AI for Cube Group Ltd, a UK umbrella payroll company.

You process documents sent by recruitment agencies: timesheets, invoices, contractor registration forms, worker lists, and company information documents.

CRITICAL RULES:
1. Classify the document type FIRST, then extract data accordingly
2. Extract data ONLY – never calculate, assume or invent values
3. Preserve original values exactly
4. Handle any column naming variation, layout or format
5. Missing fields → empty string or 0 for numbers, null for dates
6. Return ONLY a valid JSON object – no markdown, no explanation

DOCUMENT TYPE CLASSIFICATION:
- TIMESHEET: Contains hours worked, pay rates, or earnings for workers over a pay period. Should create a payroll submission.
- WORKER_LIST: A list or spreadsheet of worker/contractor names and personal details (no earnings data). Should create/update worker records.
- CONTRACTOR_REGISTRATION: A registration or new starter form for a single contractor with personal, tax, and bank details.
- COMPANY_INFO: Contains company details, contact info, or registration data for an agency/employer. Should create/update a company.
- INVOICE: A billing document from an agency to Cube Group.
- CIS: A CIS (Construction Industry Scheme) document with subcontractor and tax deduction details.
- MIXED: Contains a mix of the above (e.g. a timesheet that also includes new starter data).
- UNKNOWN: Cannot determine document type or no useful data found.

OUTPUT SCHEMA:
{
  "documentType": "TIMESHEET | WORKER_LIST | CONTRACTOR_REGISTRATION | COMPANY_INFO | INVOICE | CIS | MIXED | UNKNOWN",
  "confidence": 0.0-1.0,
  "companyData": {
    "name": "",
    "tradingName": "",
    "companyNumber": "",
    "vatNumber": "",
    "address": "",
    "phone": "",
    "email": "",
    "website": "",
    "contactName": ""
  },
  "payrollEntries": [
    {
      "companyName": "agency/client name",
      "payrollWeek": "week ending date string",
      "workerName": "full name fallback",
      "niNumber": "NI number / employee ID",
      "firstName": "", "lastName": "",
      "isNewStarter": false, "isLeaver": false,
      "startDate": "YYYY-MM-DD or null",
      "hoursWorked": 0, "hourlyRate": 0,
      "basicPay": 0, "overtimeHours": 0, "overtimeRate": 0, "overtimePay": 0,
      "holidayHours": 0, "holidayPay": 0, "statutoryPay": 0,
      "totalGrossPay": 0, "grossPay": 0,
      "umbrellaCompany": "", "department": "", "site": "", "notes": "",
      "jobTitle": ""
    }
  ],
  "workerData": [
    {
      "title": "", "firstName": "", "middleNames": "", "lastName": "",
      "gender": "", "dateOfBirth": "YYYY-MM-DD or null",
      "nationality": "", "nationalInsurance": "", "niCategory": "",
      "mobile": "", "phone": "", "email": "",
      "addressLine1": "", "addressLine2": "", "addressLine3": "",
      "town": "", "county": "", "livingCountry": "", "postCode": "",
      "nameOnBankAccount": "", "bankName": "", "bankAccountNumber": "", "bankSortCode": "",
      "startDate": "YYYY-MM-DD or null", "payFrequency": "",
      "taxCode": "", "taxBasis": "",
      "starterDeclaration": "", "p45GrossForTax": 0, "p45TaxDeducted": 0,
      "product": "", "agency": "", "branch": "", "agencyRef": "",
      "jobDescription": "", "utrNumber": "", "cisStatus": "",
      "tradingName": "", "contractorType": "",
      "pensionApplicable": false, "apprenticeshipLevy": false
    }
  ]
}

FIELD MAPPING GUIDANCE:
- TIMESHEET: Populate payrollEntries. Each row = one worker for that pay period. Set companyData.name to the agency/employer name if visible.
- WORKER_LIST: Populate workerData with each worker's details. Set companyData.name to the agency name if present.
- CONTRACTOR_REGISTRATION: Populate workerData for the single contractor. Include all personal/tax/bank details.
- COMPANY_INFO: Populate companyData only. Leave payrollEntries and workerData empty.
- INVOICE: Populate payrollEntries as line items. Set companyData to the issuing company.
- CIS: Populate workerData for subcontractors and payrollEntries for CIS amounts.
- MIXED: Populate all relevant sections.
- totalGrossPay and grossPay should both reflect total gross earnings. If hourly rate and hours are present but gross is missing, do NOT calculate – leave grossPay as 0.`
  }

  private buildTextPrompt(content: string, fileType: string): string {
    return `Analyse the following ${fileType} document from a UK recruitment agency and extract all payroll and contractor data.

DOCUMENT CONTENT:
${content}

Return ONLY a valid JSON object matching the schema in the system prompt. All numeric values must be numbers (not strings).`
  }

  private parseResponse(message: Anthropic.Message): FullExtractionResult {
    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : null
    if (!responseText) throw new Error('No response from Claude')

    // Strip any markdown fences Claude occasionally adds
    const clean = responseText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(clean)

    const companyRaw = parsed.companyData
    const companyData: CompanyExtractionData | undefined = companyRaw && Object.values(companyRaw).some(v => v)
      ? {
          name:          companyRaw.name          || undefined,
          tradingName:   companyRaw.tradingName   || undefined,
          companyNumber: companyRaw.companyNumber || undefined,
          vatNumber:     companyRaw.vatNumber     || undefined,
          address:       companyRaw.address       || undefined,
          phone:         companyRaw.phone         || undefined,
          email:         companyRaw.email         || undefined,
          website:       companyRaw.website       || undefined,
          contactName:   companyRaw.contactName   || undefined,
        }
      : undefined

    return {
      success: true,
      documentType: parsed.documentType || 'UNKNOWN',
      payrollEntries: this.normalizePayrollEntries(parsed.payrollEntries || parsed.data || []),
      workerData: parsed.workerData || [],
      companyData,
      confidence: parsed.confidence || 0.8,
      rawResponse: responseText,
    }
  }

  private normalizePayrollEntries(entries: any[]): NormalizedPayrollData[] {
    return entries.map(e => ({
      companyName:   String(e.companyName   || e.company   || ''),
      payrollWeek:   String(e.payrollWeek   || e.week      || e.period || ''),
      workerName:    String(e.workerName    || e.name      || `${e.firstName || ''} ${e.lastName || ''}`.trim() || ''),
      niNumber:      String(e.niNumber      || e.employeeId|| ''),
      firstName:     String(e.firstName     || ''),
      lastName:      String(e.lastName      || ''),
      isNewStarter:  Boolean(e.isNewStarter),
      isLeaver:      Boolean(e.isLeaver),
      startDate:     e.startDate            || undefined,
      hoursWorked:   Number(e.hoursWorked   || e.hours     || 0),
      hourlyRate:    Number(e.hourlyRate    || e.rate      || 0),
      basicPay:      Number(e.basicPay      || 0),
      overtimeHours: Number(e.overtimeHours || 0),
      overtimeRate:  Number(e.overtimeRate  || 0),
      overtimePay:   Number(e.overtimePay   || 0),
      holidayHours:  Number(e.holidayHours  || 0),
      holidayPay:    Number(e.holidayPay    || 0),
      statutoryPay:  Number(e.statutoryPay  || 0),
      totalGrossPay: Number(e.totalGrossPay || e.grossPay  || e.gross || 0),
      grossPay:      Number(e.grossPay      || e.totalGrossPay || e.gross || 0),
      umbrellaCompany: String(e.umbrellaCompany || e.umbrella || ''),
      department:    String(e.department    || e.dept      || ''),
      site:          String(e.site          || e.location  || e.project || ''),
      notes:         String(e.notes         || e.remarks   || ''),
      jobTitle:      String(e.jobTitle      || ''),
    }))
  }
}

let aiExtractionService: AIExtractionService | null = null
export function getAIExtractionService(): AIExtractionService {
  if (!aiExtractionService) aiExtractionService = new AIExtractionService()
  return aiExtractionService
}
