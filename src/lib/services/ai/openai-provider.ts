import OpenAI from 'openai'
import { BaseAIProvider } from './ai-provider'
import { DocumentExtractionResult, PayrollEntryData } from '@/types'

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI

  constructor() {
    super()
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async extractPayrollData(text: string, context?: any): Promise<DocumentExtractionResult> {
    try {
      const prompt = this.buildExtractionPrompt(text, context)
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert at extracting payroll data from documents. 
            Extract worker names, hours, rates, gross pay, and any other relevant payroll information.
            Return the data as valid JSON matching the PayrollEntryData schema.
            Be tolerant of inconsistent formats and extract as much information as possible.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return {
          success: false,
          error: 'No response from AI',
        }
      }

      const parsed = JSON.parse(content)
      
      return {
        success: true,
        data: parsed,
        confidence: 0.9,
      }
    } catch (error) {
      console.error('OpenAI extraction error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async normalizeData(data: any): Promise<PayrollEntryData[]> {
    try {
      const prompt = `Normalize the following payroll data into a consistent format.
      Each entry should have: companyName, payrollWeek, workerName, hoursWorked, hourlyRate, grossPay, cubeFee, umbrellaFee, umbrellaCompany.
      
      Data: ${JSON.stringify(data)}
      
      Return as JSON array of normalized entries.`

      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You normalize payroll data into a consistent schema. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }

      const parsed = JSON.parse(content)
      return parsed.entries || []
    } catch (error) {
      console.error('OpenAI normalization error:', error)
      throw error
    }
  }

  private buildExtractionPrompt(text: string, context?: any): string {
    let prompt = `Extract payroll information from the following document text:\n\n${text}\n\n`
    
    if (context?.companyName) {
      prompt += `Company: ${context.companyName}\n`
    }
    
    if (context?.payrollWeek) {
      prompt += `Payroll Week: ${context.payrollWeek}\n`
    }
    
    prompt += `\nExtract all worker entries with their hours, rates, and pay. Return as JSON with structure:
    {
      "companyName": "string",
      "payrollWeek": "string",
      "entries": [
        {
          "workerName": "string",
          "hoursWorked": number,
          "hourlyRate": number,
          "grossPay": number,
          "department": "string (optional)",
          "umbrellaCompany": "string (optional)"
        }
      ]
    }`
    
    return prompt
  }
}
