// Universal Payroll Schema
export interface NormalizedPayrollData {
  companyName: string
  payrollWeek: string
  workerName: string
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  umbrellaCompany: string
  department: string
  site: string
  notes: string
}

// AI Extraction Response
export interface AIExtractionResult {
  success: boolean
  data: NormalizedPayrollData[]
  confidence: number
  rawResponse?: string
  error?: string
}

// Validation Result
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: string
  message: string
  fieldName?: string
  rowIndex?: number
  severity: 'ERROR' | 'WARNING' | 'INFO'
}

export interface ValidationWarning {
  type: string
  message: string
  fieldName?: string
  rowIndex?: number
}

// File Processing
export interface FileMetadata {
  filename: string
  originalFilename: string
  fileSize: number
  mimeType: string
  documentType: 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'IMAGE' | 'OTHER'
}

export interface ProcessedAttachment extends FileMetadata {
  id: string
  localPath?: string
  storageUrl?: string
  extractedText?: string
  extractedData?: any
}

// Workflow
export interface WorkflowContext {
  emailImportId: string
  payrollSubmissionId?: string
  currentState: string
  metadata?: Record<string, any>
}

export interface WorkflowTransition {
  from: string
  to: string
  timestamp: Date
  message: string
  metadata?: Record<string, any>
}
