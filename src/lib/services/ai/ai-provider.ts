import { AIProvider, DocumentExtractionResult, PayrollEntryData } from '@/types'

export abstract class BaseAIProvider implements AIProvider {
  abstract extractPayrollData(text: string, context?: any): Promise<DocumentExtractionResult>
  abstract normalizeData(data: any): Promise<PayrollEntryData[]>
}
