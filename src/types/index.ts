import { 
  UserRole, 
  WorkflowState, 
  InvoiceStatus, 
  PaymentStatus, 
  DocumentType, 
  InvoiceType 
} from '@prisma/client'

export type {
  UserRole,
  WorkflowState,
  InvoiceStatus,
  PaymentStatus,
  DocumentType,
  InvoiceType,
}

export interface PayrollEntryData {
  companyName: string
  payrollWeek: string
  workerName: string
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  cubeFee: number
  umbrellaFee: number
  umbrellaCompany: string
  department?: string
  projectSite?: string
  notes?: string
}

export interface ExtractedPayrollData {
  companyName?: string
  payrollWeek?: string
  payrollWeekStart?: string
  payrollWeekEnd?: string
  entries: PayrollEntryData[]
  totalGrossPay?: number
  totalHours?: number
  metadata?: Record<string, any>
}

export interface DocumentExtractionResult {
  success: boolean
  data?: ExtractedPayrollData
  error?: string
  rawText?: string
  confidence?: number
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface InvoiceGenerationData {
  invoiceType: InvoiceType
  companyId?: string
  umbrellaCompanyId?: string
  payrollSubmissionId?: string
  items: InvoiceItemData[]
  notes?: string
  dueDate?: Date
}

export interface InvoiceItemData {
  description: string
  quantity: number
  unitPrice: number
  vatRate?: number
}

export interface SpreadsheetGenerationOptions {
  templatePath?: string
  outputFormat: 'xlsx' | 'pdf' | 'both'
  includeFormulas?: boolean
  preserveFormatting?: boolean
}

export interface EmailAttachment {
  filename: string
  mimeType: string
  size: number
  data: Buffer
}

export interface EmailMessage {
  messageId: string
  threadId?: string
  from: string
  to: string
  subject: string
  bodyText?: string
  bodyHtml?: string
  receivedAt: Date
  attachments: EmailAttachment[]
}

export interface DashboardMetrics {
  totalSubmissions: number
  pendingValidation: number
  awaitingPayment: number
  totalRevenue: number
  monthlyRevenue: number
  unpaidInvoices: number
  unpaidAmount: number
  activeCompanies: number
  activeWorkers: number
  processingFailures: number
}

export interface WorkflowTransition {
  from: WorkflowState
  to: WorkflowState
  reason?: string
  metadata?: Record<string, any>
}

export interface StorageProvider {
  upload(file: Buffer, path: string, mimeType: string): Promise<string>
  download(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
  getUrl(path: string): string
}

export interface AIProvider {
  extractPayrollData(text: string, context?: any): Promise<DocumentExtractionResult>
  normalizeData(data: any): Promise<PayrollEntryData[]>
}

export interface EmailProvider {
  connect(): Promise<void>
  fetchMessages(options?: EmailFetchOptions): Promise<EmailMessage[]>
  watchInbox(callback: (message: EmailMessage) => void): Promise<void>
  sendEmail(to: string, subject: string, body: string, attachments?: EmailAttachment[]): Promise<void>
}

export interface EmailFetchOptions {
  from?: string
  subject?: string
  after?: Date
  before?: Date
  hasAttachment?: boolean
  maxResults?: number
}

export interface PayrollValidationRules {
  maxHoursPerWeek?: number
  minHourlyRate?: number
  maxHourlyRate?: number
  requireUmbrellaCompany?: boolean
  requireDepartment?: boolean
  allowDuplicateWorkers?: boolean
}

export interface CompanyProfile {
  id: string
  name: string
  industry?: string
  billingTerms: number
  umbrellaCompany?: {
    id: string
    name: string
  }
  feeStructures: FeeStructureData[]
  payrollFrequency: string
  vatNumber?: string
  isActive: boolean
  onboardingStatus: string
}

export interface FeeStructureData {
  feeType: string
  feeAmount: number
  feePercentage?: number
  isActive: boolean
}

export interface SearchFilters {
  query?: string
  companyId?: string
  workflowState?: WorkflowState
  dateFrom?: Date
  dateTo?: Date
  status?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
