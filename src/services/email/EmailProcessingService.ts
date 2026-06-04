import { prisma } from '@/lib/prisma'
import { getAIExtractionService, FullExtractionResult, CompanyExtractionData } from '../ai/AIExtractionService'
import { getValidationService } from '../validation/ValidationService'
import { getSpreadsheetService } from '../spreadsheet/SpreadsheetService'
import { getFileDeliveryService } from '../delivery/FileDeliveryService'
import { getWorkflowService } from '../workflow/WorkflowService'
import { getStorageService } from '../storage/StorageService'
import { getFileReaderService } from '../files/FileReaderService'
import { getWorkerUpsertService } from '../workers/WorkerUpsertService'
import { getAccountingService } from '../accounting/AccountingService'
import { getAttachmentDownloadService } from './AttachmentDownloadService'
import path from 'path'
import os from 'os'
import fs from 'fs'

export interface EmailProcessingResult {
  success: boolean
  emailImportId: string
  payrollSubmissionId?: string
  workersCreated?: number
  workersUpdated?: number
  accountingExported?: boolean
  error?: string
  state?: string
}

export class EmailProcessingService {
  private aiService        = getAIExtractionService()
  private validationService = getValidationService()
  private spreadsheetService = getSpreadsheetService()
  private fileDeliveryService = getFileDeliveryService()
  private workflowService  = getWorkflowService()
  private storageService   = getStorageService()
  private fileReader       = getFileReaderService()
  private workerUpsert     = getWorkerUpsertService()
  private accounting       = getAccountingService()

  async processEmail(emailImportId: string): Promise<EmailProcessingResult> {
    try {
      const emailImport = await prisma.emailImport.findUnique({
        where: { id: emailImportId },
        include: { attachments: true },
      })
      if (!emailImport) return { success: false, emailImportId, error: 'Email import not found' }

      // ── Step 1: Ensure attachments are downloaded ───────────────────────────
      await this.workflowService.transitionState(emailImportId, 'ATTACHMENT_DOWNLOADED', 'Downloading attachments')

      // Self-healing: re-download from Gmail if local file and DB content are both missing
      let redownloadError: string | undefined
      if (emailImport.messageId) {
        await getAttachmentDownloadService()
          .redownloadIfNeeded(emailImportId, emailImport.messageId)
          .catch(e => { redownloadError = e?.message ?? String(e) })
      }

      const attachments = await prisma.attachment.findMany({ where: { emailImportId } })

      if (attachments.length === 0) {
        await this.workflowService.markAsFailed(emailImportId, 'No attachments found')
        return { success: false, emailImportId, error: 'No attachments found' }
      }

      // ── Step 2: AI extraction across all attachments ───────────────────────
      await prisma.emailImport.update({ where: { id: emailImportId }, data: { processingStatus: 'EXTRACTING' } })
      const extraction = await this.extractFromAttachments(attachments)

      // Determine routing based on document type
      const docType = extraction.documentType
      const isWorkerDoc   = ['CONTRACTOR_REGISTRATION', 'WORKER_LIST', 'CIS'].includes(docType)
      const isCompanyDoc  = docType === 'COMPANY_INFO'
      const isTimesheetDoc = ['TIMESHEET', 'INVOICE', 'MIXED'].includes(docType)
      const hasContent    = extraction.payrollEntries.length > 0 || extraction.workerData.length > 0 || !!extraction.companyData

      const extractionErr = [extraction.error, redownloadError ? `re-download: ${redownloadError}` : undefined].filter(Boolean).join('; ') || 'AI extraction returned no data'
      if (!extraction.success || !hasContent) {
        await prisma.emailImport.update({ where: { id: emailImportId }, data: { processingStatus: 'FAILED', errorMessage: extractionErr } })
        await this.workflowService.markAsFailed(emailImportId, extractionErr, extractionErr)
        return { success: false, emailImportId, error: extractionErr }
      }

      // ── Log document classification in timeline ────────────────────────────
      await prisma.workflowLog.create({
        data: {
          emailImportId,
          state: 'AI_PROCESSING',
          message: `AI classified document as: ${docType} (confidence: ${Math.round(extraction.confidence * 100)}%). Entries: ${extraction.payrollEntries.length} payroll, ${extraction.workerData.length} workers, company: ${extraction.companyData?.name || 'none'}.`,
        },
      })

      await prisma.emailImport.update({ where: { id: emailImportId }, data: { processingStatus: 'PROCESSING' } })

      // ── Step 3: Find / create company ─────────────────────────────────────
      const companyName = extraction.companyData?.name
        || extraction.payrollEntries[0]?.companyName
        || extraction.workerData[0]?.agency
        || extraction.workerData[0]?.tradingName
        || 'Unknown Company'
      const payrollWeek = extraction.payrollEntries[0]?.payrollWeek || new Date().toISOString().split('T')[0]
      const company = await this.resolveCompany(companyName, emailImport.from)

      // ── COMPANY_INFO doc → update company details and finish ───────────────
      if (isCompanyDoc) {
        await this.enrichCompany(company.id, extraction.companyData!)
        await prisma.workflowLog.create({
          data: { emailImportId, state: 'COMPLETED', message: `Company information processed — updated details for "${company.name}"` },
        })
        await prisma.emailImport.update({
          where: { id: emailImportId },
          data: { isProcessed: true, processedAt: new Date(), processingStatus: 'COMPLETED' },
        })
        return { success: true, emailImportId, state: 'COMPLETED' }
      }

      // ── Step 4: Upsert workers ─────────────────────────────────────────────
      let workersCreated = 0
      let workersUpdated = 0

      for (const wd of extraction.workerData) {
        const result = await this.workerUpsert.upsertFromExtraction(company.id, wd)
        if (result.action === 'created') workersCreated++
        else if (result.action === 'updated') workersUpdated++
      }

      // From payroll entries (timesheets with worker names only)
      if (extraction.workerData.length === 0 && extraction.payrollEntries.length > 0) {
        for (const entry of extraction.payrollEntries) {
          if (entry.firstName || entry.workerName) {
            const result = await this.workerUpsert.upsertFromPayrollEntry(company.id, entry)
            if (result.action === 'created') workersCreated++
            else if (result.action === 'updated') workersUpdated++
          }
        }
      }

      // ── WORKER_LIST / CONTRACTOR_REGISTRATION → workers only, no payroll ───
      if (isWorkerDoc && extraction.payrollEntries.length === 0) {
        await prisma.workflowLog.create({
          data: {
            emailImportId,
            state: 'COMPLETED',
            message: `${docType} processed — ${workersCreated} worker(s) created, ${workersUpdated} updated in company "${company.name}"`,
          },
        })
        await prisma.emailImport.update({
          where: { id: emailImportId },
          data: { isProcessed: true, processedAt: new Date(), processingStatus: 'COMPLETED' },
        })
        return { success: true, emailImportId, workersCreated, workersUpdated, state: 'COMPLETED' }
      }

      // ── Step 5: Validate (timesheet/invoice/mixed only) ────────────────────
      const validation = isWorkerDoc
        ? { isValid: true, errors: [] }
        : this.validationService.validate(extraction.payrollEntries)

      // ── Step 6: Create payroll submission ─────────────────────────────────
      const workflowState = validation.isValid ? 'SPREADSHEET_GENERATED' : 'VALIDATION_FAILED'
      const submission = await this.createPayrollSubmission(emailImportId, company.id, extraction.payrollEntries, payrollWeek, workflowState)

      if (!validation.isValid) {
        await this.storeValidationErrors(submission.id, validation.errors)
        await this.workflowService.transitionState(emailImportId, 'VALIDATION_FAILED', `Validation failed with ${validation.errors.length} errors`)
        return { success: false, emailImportId, payrollSubmissionId: submission.id, workersCreated, workersUpdated, error: 'Validation failed', state: 'VALIDATION_FAILED' }
      }

      // ── Step 7: Generate spreadsheet ──────────────────────────────────────
      await this.workflowService.transitionState(emailImportId, 'SPREADSHEET_GENERATED', 'Generating spreadsheet')

      const changes = await prisma.payrollChange.findMany({ where: { payrollSubmissionId: submission.id } })
      const spreadsheetResult = await this.spreadsheetService.generatePayrollSpreadsheet(
        extraction.payrollEntries,
        company.name,
        payrollWeek,
        changes.map(c => ({
          employeeId: c.employeeId || undefined,
          firstName:  c.firstName  || undefined,
          lastName:   c.lastName   || undefined,
          changeType: c.changeType,
          effectiveDate: c.effectiveDate || undefined,
          newRateOfPay:  c.newRateOfPay  || undefined,
          newJobTitle:   c.newJobTitle   || undefined,
          notes:         c.notes        || undefined,
        }))
      )

      if (!spreadsheetResult.success || !spreadsheetResult.filePath) {
        await this.workflowService.markAsFailed(emailImportId, 'Spreadsheet generation failed', spreadsheetResult.error)
        return { success: false, emailImportId, payrollSubmissionId: submission.id, error: spreadsheetResult.error }
      }

      // ── Step 8: Upload to remote server ───────────────────────────────────
      await this.workflowService.transitionState(emailImportId, 'SAVED_TO_SERVER', 'Uploading to remote server')
      const uploadResult = await this.fileDeliveryService.uploadToProcessed(spreadsheetResult.filePath, spreadsheetResult.filename!)
      if (!uploadResult.success) {
        await this.fileDeliveryService.uploadToExceptions(spreadsheetResult.filePath, spreadsheetResult.filename!)
      }

      await prisma.generatedSpreadsheet.create({
        data: {
          payrollSubmissionId: submission.id,
          filename:    spreadsheetResult.filename!,
          localPath:   spreadsheetResult.filePath,
          remotePath:  uploadResult.path,
          isUploaded:  uploadResult.success,
          uploadedAt:  uploadResult.success ? new Date() : null,
          uploadError: uploadResult.error,
        },
      })

      // ── Step 9: Push to accounting (Xero / QuickBooks) ────────────────────
      let accountingExported = false
      const accountingResult = await this.accounting.exportPayroll({
        companyId:           company.id,
        payrollSubmissionId: submission.id,
        entries:             extraction.payrollEntries,
        companyName:         company.name,
        payrollWeek,
        invoiceNumber:       `PAY-${submission.id.slice(-8).toUpperCase()}`,
        dueDate:             new Date(Date.now() + company.paymentTerms * 86_400_000),
      })
      accountingExported = accountingResult.success

      // ── Step 10: Complete ──────────────────────────────────────────────────
      await prisma.payrollSubmission.update({
        where: { id: submission.id },
        data: { workflowState: 'COMPLETED', processedAt: new Date() },
      })
      await prisma.emailImport.update({
        where: { id: emailImportId },
        data: { isProcessed: true, processedAt: new Date(), processingStatus: 'COMPLETED' },
      })

      return {
        success: true,
        emailImportId,
        payrollSubmissionId: submission.id,
        workersCreated,
        workersUpdated,
        accountingExported,
        state: 'COMPLETED',
      }
    } catch (error) {
      await this.workflowService.markAsFailed(emailImportId, error instanceof Error ? error.message : 'Processing failed')
      return { success: false, emailImportId, error: error instanceof Error ? error.message : 'Processing failed' }
    }
  }

  // ── Read every attachment file and run AI extraction ──────────────────────
  // All attachments are processed independently; results are then merged so
  // e.g. a worker-info CSV + a timesheet CSV in the same email are both handled.
  private async extractFromAttachments(attachments: any[]): Promise<FullExtractionResult> {
    const diagnostics: string[] = []
    const successful: FullExtractionResult[] = []

    for (const att of attachments) {
      let result: FullExtractionResult

      try {
        const isImage = att.documentType === 'IMAGE' || (att.mimeType || '').startsWith('image/')
        const filePath = att.localPath || att.storageUrl
        const fileOnDisk = filePath && fs.existsSync(filePath)

        const diagBase = `[${att.filename}] localPath=${att.localPath ?? 'null'} onDisk=${fileOnDisk} extractedText=${att.extractedText ? att.extractedText.length + 'chars' : 'null'}`

        if (isImage) {
          if (!fileOnDisk) { diagnostics.push(`${diagBase} → skipped (image, no disk file)`); continue }
          const { base64, mediaType } = await this.fileReader.readImageAsBase64(filePath)
          result = await this.aiService.extractFromImage(base64, mediaType)
        } else if (fileOnDisk) {
          diagnostics.push(`${diagBase} → reading from disk`)
          const content = await this.fileReader.readFile(filePath, att.mimeType || '', att.filename || '')
          result = await this.aiService.extractFromText(content.text, content.documentType)
        } else if (att.extractedText) {
          diagnostics.push(`${diagBase} → using DB extractedText`)
          const isBase64 = !/[\n\t,;"']/.test(att.extractedText.slice(0, 100)) && att.extractedText.length > 50
          const text = isBase64
            ? Buffer.from(att.extractedText, 'base64').toString('utf-8').slice(0, 8000)
            : att.extractedText.slice(0, 8000)
          const docType = (att.documentType as string) || 'CSV'
          result = await this.aiService.extractFromText(text, docType)
        } else {
          diagnostics.push(`${diagBase} → skipped (no file, no extractedText)`)
          continue
        }

        if (result.success) {
          await prisma.attachment.update({
            where: { id: att.id },
            data: {
              extractedData: { entries: result.payrollEntries, workers: result.workerData } as any,
              status: 'EXTRACTED',
              processedAt: new Date(),
            },
          })
          successful.push(result)
        } else {
          diagnostics.push(`${diagBase} → AI returned success=false: ${result.error ?? 'no error'}`)
        }
      } catch (e: any) {
        diagnostics.push(`${att.filename} → threw: ${e?.message ?? e}`)
      }
    }

    if (successful.length === 0) {
      return {
        success: false, documentType: 'UNKNOWN', payrollEntries: [], workerData: [], confidence: 0,
        error: `No processable attachments. Details: ${diagnostics.join(' | ') || 'no attachments passed'}`,
      }
    }

    if (successful.length === 1) return successful[0]

    return this.mergeExtractionResults(successful)
  }

  // ── Merge results from multiple attachments into one combined result ────────
  private mergeExtractionResults(results: FullExtractionResult[]): FullExtractionResult {
    const allPayrollEntries = results.flatMap(r => r.payrollEntries)
    const allWorkerData     = results.flatMap(r => r.workerData)
    const companyData       = results.find(r => r.companyData)?.companyData

    const types      = results.map(r => r.documentType)
    const hasSheet   = types.some(t => ['TIMESHEET', 'INVOICE'].includes(t))
    const hasWorkers = types.some(t => ['WORKER_LIST', 'CONTRACTOR_REGISTRATION', 'CIS'].includes(t))
    const hasCompany = types.some(t => t === 'COMPANY_INFO')

    // If exactly one type is present keep it; otherwise MIXED covers everything
    let documentType: FullExtractionResult['documentType'] = 'MIXED'
    if (hasSheet && !hasWorkers && !hasCompany) {
      documentType = results.find(r => ['TIMESHEET', 'INVOICE'].includes(r.documentType))!.documentType
    } else if (hasWorkers && !hasSheet && !hasCompany) {
      documentType = 'WORKER_LIST'
    } else if (hasCompany && !hasSheet && !hasWorkers) {
      documentType = 'COMPANY_INFO'
    }

    return {
      success:        true,
      documentType,
      payrollEntries: allPayrollEntries,
      workerData:     allWorkerData,
      companyData,
      confidence:     results.reduce((s, r) => s + r.confidence, 0) / results.length,
    }
  }

  // ── Enrich company with AI-extracted data ─────────────────────────────────
  private async enrichCompany(companyId: string, data: CompanyExtractionData) {
    const update: Record<string, any> = {}
    if (data.tradingName)   update.tradingName   = data.tradingName
    if (data.companyNumber) update.companyNumber = data.companyNumber
    if (data.vatNumber)     update.vatNumber     = data.vatNumber
    if (data.phone)         update.phone         = data.phone
    if (data.email)         update.email         = data.email
    if (data.website)       update.website       = data.website
    if (data.address)       update.address       = data.address
    if (Object.keys(update).length > 0) {
      await prisma.company.update({ where: { id: companyId }, data: update }).catch(() => {/* ignore unknown fields */})
    }
  }

  // ── Find or create company matched on name / sender domain ─────────────────
  private async resolveCompany(companyName: string, fromEmail?: string) {
    // 1. Try exact / fuzzy name match
    let company = await prisma.company.findFirst({
      where: { name: { contains: companyName, mode: 'insensitive' } },
    })

    // 2. Try email domain match
    if (!company && fromEmail) {
      const domain = fromEmail.split('@')[1]?.toLowerCase()
      if (domain) {
        company = await prisma.company.findFirst({
          where: { emailDomains: { has: domain } },
        })
      }
    }

    if (!company) {
      const creator = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
      }) || await prisma.user.findFirst()
      if (!creator) throw new Error('No users found in database — add at least one user before email processing can create companies')
      company = await prisma.company.create({
        data: { name: companyName, createdById: creator.id },
      })
    }

    return company
  }

  // ── Create PayrollSubmission + PayrollEntries ─────────────────────────────
  private async createPayrollSubmission(
    emailImportId: string,
    companyId: string,
    payrollData: any[],
    payrollWeek: string,
    workflowState: any
  ) {
    const submission = await prisma.payrollSubmission.create({
      data: {
        companyId,
        emailImportId,
        payrollWeek,
        workflowState,
        totalHours:    payrollData.reduce((s, e) => s + (e.hoursWorked || 0), 0),
        totalGrossPay: payrollData.reduce((s, e) => s + (e.grossPay || e.totalGrossPay || 0), 0),
      },
    })

    for (const entry of payrollData) {
      await prisma.payrollEntry.create({
        data: {
          payrollSubmissionId: submission.id,
          employeeId:    entry.niNumber    || null,
          workerName:    entry.workerName  || `${entry.firstName || ''} ${entry.lastName || ''}`.trim(),
          firstName:     entry.firstName   || null,
          lastName:      entry.lastName    || null,
          isNewStarter:  entry.isNewStarter ?? false,
          isLeaver:      entry.isLeaver    ?? false,
          startDate:     entry.startDate   ? new Date(entry.startDate) : null,
          hoursWorked:   entry.hoursWorked  || 0,
          hourlyRate:    entry.hourlyRate   || 0,
          basicPay:      entry.basicPay     || 0,
          overtimeHours: entry.overtimeHours || 0,
          overtimeRate:  entry.overtimeRate  || 0,
          overtimePay:   entry.overtimePay   || 0,
          holidayHours:  entry.holidayHours  || 0,
          holidayPay:    entry.holidayPay    || 0,
          statutoryPay:  entry.statutoryPay  || 0,
          totalGrossPay: entry.totalGrossPay || entry.grossPay || 0,
          grossPay:      entry.grossPay      || entry.totalGrossPay || 0,
          department:    entry.department    || null,
          projectSite:   entry.site         || null,
          payrollWeek,
          notes:         entry.notes        || null,
          rawData:       entry,
        },
      })
    }

    return submission
  }

  private async storeValidationErrors(payrollSubmissionId: string, errors: any[]) {
    for (const error of errors) {
      await prisma.validationError.create({
        data: {
          payrollSubmissionId,
          errorType:    error.type,
          errorMessage: error.message,
          fieldName:    error.fieldName,
          rowIndex:     error.rowIndex,
          severity:     error.severity,
        },
      })
    }
  }
}

// Singleton instance
let emailProcessingService: EmailProcessingService | null = null

export function getEmailProcessingService(): EmailProcessingService {
  if (!emailProcessingService) {
    emailProcessingService = new EmailProcessingService()
  }
  return emailProcessingService
}
