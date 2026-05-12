import { BaseAIProvider } from './ai-provider'
import { DocumentExtractionResult, PayrollEntryData } from '@/types'

export class BedrockProvider extends BaseAIProvider {
  async extractPayrollData(text: string, context?: any): Promise<DocumentExtractionResult> {
    throw new Error('BedrockProvider not yet implemented. Migrate from OpenAI.')
  }

  async normalizeData(data: any): Promise<PayrollEntryData[]> {
    throw new Error('BedrockProvider not yet implemented. Migrate from OpenAI.')
  }
}
