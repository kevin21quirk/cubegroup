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

export interface FullExtractionResult {
  success: boolean
  documentType: 'TIMESHEET' | 'INVOICE' | 'CONTRACTOR_REGISTRATION' | 'CIS' | 'MIXED' | 'UNKNOWN'
  payrollEntries: NormalizedPayrollData[]
  workerData: WorkerExtractionData[]      // worker profile info found in document
  confidence: number
  rawResponse?: string
  error?: string
}

export class AIExtractionService {
  private anthropic: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
    this.anthropic = new Anthropic({ apiKey })
  }

  // ── Main extraction – text-based attachments ──────────────────────────────
  async extractFromText(content: string, fileType: string): Promise<FullExtractionResult> {
    try {
      const message = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
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
      const message = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
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

You process documents sent by recruitment agencies: timesheets, invoices, contractor registration forms and CIS documents.

CRITICAL RULES:
1. Extract data ONLY – never calculate, assume or invent values
2. Preserve original values exactly
3. Handle any column naming variation, layout or format
4. Missing fields → empty string or 0 for numbers, null for dates
5. Return ONLY a valid JSON object – no markdown, no explanation

OUTPUT SCHEMA:
{
  "documentType": "TIMESHEET | INVOICE | CONTRACTOR_REGISTRATION | CIS | MIXED | UNKNOWN",
  "confidence": 0.0-1.0,
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
- For timesheets: focus on payrollEntries. Each row = one worker for that pay period.
- For invoices: treat each line item as a payroll entry where applicable.
- For contractor registration / new starter forms: populate workerData with personal details.
- For CIS documents: extract subcontractor details into workerData and CIS amounts into payrollEntries.
- totalGrossPay and grossPay should both reflect the total gross earnings for the worker.
- If hourly rate and hours are present but gross is missing, do NOT calculate – leave grossPay as 0.`
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

    return {
      success: true,
      documentType: parsed.documentType || 'UNKNOWN',
      payrollEntries: this.normalizePayrollEntries(parsed.payrollEntries || parsed.data || []),
      workerData: parsed.workerData || [],
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
