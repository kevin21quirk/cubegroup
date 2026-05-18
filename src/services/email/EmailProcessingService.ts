import { prisma } from '@/lib/prisma'
import { getAIExtractionService } from '../ai/AIExtractionService'
import { getValidationService } from '../validation/ValidationService'
import { getSpreadsheetService } from '../spreadsheet/SpreadsheetService'
import { getFileDeliveryService } from '../delivery/FileDeliveryService'
import { getWorkflowService } from '../workflow/WorkflowService'
import { getStorageService } from '../storage/StorageService'
import fs from 'fs/promises'

export interface EmailProcessingResult {
  success: boolean
  emailImportId: string
  payrollSubmissionId?: string
  error?: string
  state?: string
}

export class EmailProcessingService {
  private aiService = getAIExtractionService()
  private validationService = getValidationService()
  private spreadsheetService = getSpreadsheetService()
  private fileDeliveryService = getFileDeliveryService()
  private workflowService = getWorkflowService()
  private storageService = getStorageService()

  async processEmail(emailImportId: string): Promise<EmailProcessingResult> {
    try {
      // Get email import
      const emailImport = await prisma.emailImport.findUnique({
        where: { id: emailImportId },
        include: { attachments: true }
      })

      if (!emailImport) {
        return {
          success: false,
          emailImportId,
          error: 'Email import not found'
        }
      }

      // Step 1: Download attachments
      await this.workflowService.transitionState(
        emailImportId,
        'ATTACHMENT_DOWNLOADED',
        'Downloading attachments'
      )

      const attachments = await this.downloadAttachments(emailImport.id)

      if (attachments.length === 0) {
        await this.workflowService.markAsFailed(
          emailImportId,
          'No attachments found'
        )
        return {
          success: false,
          emailImportId,
          error: 'No attachments found'
        }
      }

      // Step 2: Extract payroll data using AI
      await this.workflowService.transitionState(
        emailImportId,
        'AI_PROCESSING',
        'Extracting payroll data'
      )

      const extractionResult = await this.extractPayrollData(attachments)

      if (!extractionResult.success || extractionResult.data.length === 0) {
        await this.workflowService.markAsFailed(
          emailImportId,
          'AI extraction failed',
          extractionResult.error
        )
        return {
          success: false,
          emailImportId,
          error: extractionResult.error
        }
      }

      // Step 3: Validate payroll data
      const validationResult = this.validationService.validate(extractionResult.data)

      if (!validationResult.isValid) {
        // Create payroll submission in validation failed state
        const payrollSubmission = await this.createPayrollSubmission(
          emailImportId,
          extractionResult.data,
          'VALIDATION_FAILED'
        )

        // Store validation errors
        await this.storeValidationErrors(payrollSubmission.id, validationResult.errors)

        await this.workflowService.transitionState(
          emailImportId,
          'VALIDATION_FAILED',
          `Validation failed with ${validationResult.errors.length} errors`
        )

        return {
          success: false,
          emailImportId,
          payrollSubmissionId: payrollSubmission.id,
          error: 'Validation failed',
          state: 'VALIDATION_FAILED'
        }
      }

      // Step 4: Create payroll submission
      const payrollSubmission = await this.createPayrollSubmission(
        emailImportId,
        extractionResult.data,
        'SPREADSHEET_GENERATED'
      )

      // Step 5: Generate spreadsheet
      await this.workflowService.transitionState(
        emailImportId,
        'SPREADSHEET_GENERATED',
        'Generating spreadsheet'
      )

      const companyName = extractionResult.data[0]?.companyName || 'Unknown'
      const payrollWeek = extractionResult.data[0]?.payrollWeek || 'Unknown'

      const spreadsheetResult = await this.spreadsheetService.generatePayrollSpreadsheet(
        extractionResult.data,
        companyName,
        payrollWeek
      )

      if (!spreadsheetResult.success || !spreadsheetResult.filePath) {
        await this.workflowService.markAsFailed(
          emailImportId,
          'Spreadsheet generation failed',
          spreadsheetResult.error
        )
        return {
          success: false,
          emailImportId,
          payrollSubmissionId: payrollSubmission.id,
          error: spreadsheetResult.error
        }
      }

      // Step 6: Save to remote server
      await this.workflowService.transitionState(
        emailImportId,
        'SAVED_TO_SERVER',
        'Uploading to remote server'
      )

      const uploadResult = await this.fileDeliveryService.uploadToProcessed(
        spreadsheetResult.filePath,
        spreadsheetResult.filename!
      )

      if (!uploadResult.success) {
        // Upload failed, move to exceptions folder
        await this.fileDeliveryService.uploadToExceptions(
          spreadsheetResult.filePath,
          spreadsheetResult.filename!
        )
      }

      // Store generated spreadsheet record
      await prisma.generatedSpreadsheet.create({
        data: {
          payrollSubmissionId: payrollSubmission.id,
          filename: spreadsheetResult.filename!,
          localPath: spreadsheetResult.filePath,
          remotePath: uploadResult.path,
          isUploaded: uploadResult.success,
          uploadedAt: uploadResult.success ? new Date() : null,
          uploadError: uploadResult.error
        }
      })

      // Step 7: Mark as completed
      await prisma.payrollSubmission.update({
        where: { id: payrollSubmission.id },
        data: { workflowState: 'COMPLETED', processedAt: new Date() }
      })

      await prisma.emailImport.update({
        where: { id: emailImportId },
        data: { isProcessed: true, processedAt: new Date() }
      })

      return {
        success: true,
        emailImportId,
        payrollSubmissionId: payrollSubmission.id,
        state: 'COMPLETED'
      }
    } catch (error) {
      await this.workflowService.markAsFailed(
        emailImportId,
        error instanceof Error ? error.message : 'Processing failed'
      )

      return {
        success: false,
        emailImportId,
        error: error instanceof Error ? error.message : 'Processing failed'
      }
    }
  }

  private async downloadAttachments(emailImportId: string) {
    // TODO: Implement actual attachment download from Gmail
    // For now, return existing attachments
    return prisma.attachment.findMany({
      where: { emailImportId }
    })
  }

  private async extractPayrollData(attachments: any[]) {
    // Process each attachment
    for (const attachment of attachments) {
      if (attachment.documentType === 'XLSX' || attachment.documentType === 'CSV') {
        // TODO: Read file content
        const content = 'Sample payroll data'
        
        const result = await this.aiService.extractPayrollData(
          content,
          attachment.documentType
        )

        if (result.success) {
          // Store extracted data (wrap array in object for Json type)
          await prisma.attachment.update({
            where: { id: attachment.id },
            data: {
              extractedData: { entries: result.data },
              status: 'EXTRACTED',
              processedAt: new Date()
            }
          })

          return result
        }
      }
    }

    return {
      success: false,
      data: [],
      confidence: 0,
      error: 'No valid attachments to process'
    }
  }

  private async createPayrollSubmission(
    emailImportId: string,
    payrollData: any[],
    workflowState: any
  ) {
    const firstEntry = payrollData[0] || {}
    const companyName = firstEntry.companyName || 'Unknown'
    const payrollWeek = firstEntry.payrollWeek || 'Unknown'

    // Find or create company
    let company = await prisma.company.findFirst({
      where: { name: { contains: companyName, mode: 'insensitive' } }
    })

    if (!company) {
      // Get super admin user
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
      })

      if (!superAdmin) {
        throw new Error('No super admin user found')
      }

      company = await prisma.company.create({
        data: {
          name: companyName,
          createdById: superAdmin.id
        }
      })
    }

    // Create payroll submission
    const submission = await prisma.payrollSubmission.create({
      data: {
        companyId: company.id,
        emailImportId,
        payrollWeek,
        workflowState,
        totalHours: payrollData.reduce((sum, e) => sum + e.hoursWorked, 0),
        totalGrossPay: payrollData.reduce((sum, e) => sum + e.grossPay, 0)
      }
    })

    // Create payroll entries
    for (const entry of payrollData) {
      await prisma.payrollEntry.create({
        data: {
          payrollSubmissionId: submission.id,
          workerName: entry.workerName,
          hoursWorked: entry.hoursWorked,
          hourlyRate: entry.hourlyRate,
          grossPay: entry.grossPay,
          department: entry.department,
          projectSite: entry.site,
          payrollWeek: entry.payrollWeek,
          notes: entry.notes,
          rawData: entry
        }
      })
    }

    return submission
  }

  private async storeValidationErrors(payrollSubmissionId: string, errors: any[]) {
    for (const error of errors) {
      await prisma.validationError.create({
        data: {
          payrollSubmissionId,
          errorType: error.type,
          errorMessage: error.message,
          fieldName: error.fieldName,
          rowIndex: error.rowIndex,
          severity: error.severity
        }
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
