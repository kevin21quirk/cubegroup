import { AIExtractionResult, NormalizedPayrollData } from '@/types/payroll'
import Anthropic from '@anthropic-ai/sdk'

export class AIExtractionService {
  private anthropic: Anthropic

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    this.anthropic = new Anthropic({ apiKey })
  }

  async extractPayrollData(
    content: string,
    fileType: string
  ): Promise<AIExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(content, fileType)
      
      const message = await this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 4096,
        temperature: 0.1,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = message.content[0]?.type === 'text' ? message.content[0].text : null
      if (!responseText) {
        throw new Error('No response from Claude')
      }

      const parsed = JSON.parse(responseText)
      
      return {
        success: true,
        data: this.normalizeAIResponse(parsed),
        confidence: parsed.confidence || 0.9,
        rawResponse: responseText
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'AI extraction failed'
      }
    }
  }

  private getSystemPrompt(): string {
    return `You are a payroll data extraction specialist for a UK umbrella payroll company.

Your task is to extract payroll data from various document formats and normalize it into a consistent JSON structure.

CRITICAL RULES:
1. Extract data ONLY - do NOT perform calculations
2. Preserve original values exactly as they appear
3. Handle inconsistent column names and layouts
4. Tolerate missing or incomplete data
5. Return data in the exact schema provided

OUTPUT SCHEMA:
{
  "payrollEntries": [
    {
      "companyName": "string",
      "payrollWeek": "string (e.g., 'Week Ending 2024-01-15')",
      "workerName": "string",
      "hoursWorked": number,
      "hourlyRate": number,
      "grossPay": number,
      "umbrellaCompany": "string",
      "department": "string",
      "site": "string",
      "notes": "string"
    }
  ],
  "confidence": number (0-1)
}

FIELD MAPPING GUIDANCE:
- companyName: Client company, employer, or business name
- payrollWeek: Week ending date, pay period, or week reference
- workerName: Employee name, contractor name, or worker
- hoursWorked: Hours, total hours, or time worked
- hourlyRate: Rate, pay rate, or hourly wage
- grossPay: Gross pay, total pay, or earnings
- umbrellaCompany: Umbrella provider, agency, or payroll company
- department: Department, division, or team
- site: Site, location, or project
- notes: Any additional information or remarks

If a field is missing, use empty string for text fields or 0 for numbers.`
  }

  private buildExtractionPrompt(content: string, fileType: string): string {
    return `Extract payroll data from the following ${fileType} content:

${content}

Please analyze this document and extract all payroll entries. Return ONLY a valid JSON object (no markdown, no explanation) in the exact format specified in the system prompt. Ensure all numeric values are numbers, not strings.`
  }

  private normalizeAIResponse(response: any): NormalizedPayrollData[] {
    const entries = response.payrollEntries || response.data || []
    
    return entries.map((entry: any) => ({
      companyName: String(entry.companyName || entry.company || ''),
      payrollWeek: String(entry.payrollWeek || entry.week || entry.period || ''),
      workerName: String(entry.workerName || entry.name || entry.employee || ''),
      hoursWorked: Number(entry.hoursWorked || entry.hours || 0),
      hourlyRate: Number(entry.hourlyRate || entry.rate || 0),
      grossPay: Number(entry.grossPay || entry.gross || entry.pay || 0),
      umbrellaCompany: String(entry.umbrellaCompany || entry.umbrella || ''),
      department: String(entry.department || entry.dept || ''),
      site: String(entry.site || entry.location || entry.project || ''),
      notes: String(entry.notes || entry.remarks || '')
    }))
  }
}

// Singleton instance
let aiExtractionService: AIExtractionService | null = null

export function getAIExtractionService(): AIExtractionService {
  if (!aiExtractionService) {
    aiExtractionService = new AIExtractionService()
  }
  return aiExtractionService
}
