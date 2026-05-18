import { prisma } from '@/lib/prisma'
import { WorkflowState } from '@prisma/client'

export interface WorkflowTransitionResult {
  success: boolean
  newState?: WorkflowState
  error?: string
}

export class WorkflowService {
  private validTransitions: Map<WorkflowState, WorkflowState[]>

  constructor() {
    this.validTransitions = new Map([
      ['EMAIL_RECEIVED', ['ATTACHMENT_DOWNLOADED', 'FAILED']],
      ['ATTACHMENT_DOWNLOADED', ['AI_PROCESSING', 'FAILED']],
      ['AI_PROCESSING', ['VALIDATION_FAILED', 'AWAITING_REVIEW', 'SPREADSHEET_GENERATED', 'FAILED']],
      ['VALIDATION_FAILED', ['AWAITING_REVIEW', 'AI_PROCESSING', 'FAILED']],
      ['AWAITING_REVIEW', ['SPREADSHEET_GENERATED', 'AI_PROCESSING', 'FAILED']],
      ['SPREADSHEET_GENERATED', ['SAVED_TO_SERVER', 'FAILED']],
      ['SAVED_TO_SERVER', ['READY_FOR_INVOICE', 'COMPLETED']],
      ['READY_FOR_INVOICE', ['INVOICE_SENT', 'COMPLETED']],
      ['INVOICE_SENT', ['AWAITING_PAYMENT']],
      ['AWAITING_PAYMENT', ['PAYMENT_RECEIVED']],
      ['PAYMENT_RECEIVED', ['UMBRELLA_INVOICE_SENT', 'COMPLETED']],
      ['UMBRELLA_INVOICE_SENT', ['COMPLETED']],
      ['COMPLETED', []],
      ['FAILED', ['EMAIL_RECEIVED', 'AI_PROCESSING']]
    ])
  }

  async transitionState(
    emailImportId: string,
    newState: WorkflowState,
    message?: string,
    metadata?: any
  ): Promise<WorkflowTransitionResult> {
    try {
      // Get current email import
      const emailImport = await prisma.emailImport.findUnique({
        where: { id: emailImportId },
        include: { payrollSubmission: true }
      })

      if (!emailImport) {
        return {
          success: false,
          error: 'Email import not found'
        }
      }

      const currentState = emailImport.payrollSubmission?.workflowState || 'EMAIL_RECEIVED'

      // Validate transition
      if (!this.isValidTransition(currentState, newState)) {
        return {
          success: false,
          error: `Invalid transition from ${currentState} to ${newState}`
        }
      }

      // Update payroll submission state
      if (emailImport.payrollSubmission) {
        await prisma.payrollSubmission.update({
          where: { id: emailImport.payrollSubmission.id },
          data: { workflowState: newState }
        })
      }

      // Log workflow transition
      await prisma.workflowLog.create({
        data: {
          emailImportId,
          state: newState,
          message: message || `Transitioned to ${newState}`,
          metadata: metadata || {}
        }
      })

      return {
        success: true,
        newState
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Workflow transition failed'
      }
    }
  }

  isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
    const allowedTransitions = this.validTransitions.get(from)
    return allowedTransitions?.includes(to) || false
  }

  async getWorkflowHistory(emailImportId: string) {
    return prisma.workflowLog.findMany({
      where: { emailImportId },
      orderBy: { createdAt: 'asc' }
    })
  }

  async getWorkflowTimeline(emailImportId: string) {
    const logs = await this.getWorkflowHistory(emailImportId)
    
    return logs.map((log, index) => ({
      state: log.state,
      message: log.message,
      timestamp: log.createdAt,
      duration: index > 0 
        ? log.createdAt.getTime() - logs[index - 1].createdAt.getTime()
        : 0,
      metadata: log.metadata
    }))
  }

  async markAsFailed(
    emailImportId: string,
    errorMessage: string,
    errorDetails?: any
  ): Promise<void> {
    await this.transitionState(
      emailImportId,
      'FAILED',
      errorMessage,
      { error: errorDetails }
    )

    // Update email import
    await prisma.emailImport.update({
      where: { id: emailImportId },
      data: {
        processingStatus: 'FAILED',
        errorMessage
      }
    })
  }

  async retryProcessing(emailImportId: string): Promise<WorkflowTransitionResult> {
    const emailImport = await prisma.emailImport.findUnique({
      where: { id: emailImportId }
    })

    if (!emailImport) {
      return {
        success: false,
        error: 'Email import not found'
      }
    }

    // Update retry count
    await prisma.emailImport.update({
      where: { id: emailImportId },
      data: {
        retryCount: emailImport.retryCount + 1,
        lastRetryAt: new Date(),
        processingStatus: 'PENDING'
      }
    })

    return this.transitionState(
      emailImportId,
      'EMAIL_RECEIVED',
      'Retrying processing'
    )
  }
}

// Singleton instance
let workflowService: WorkflowService | null = null

export function getWorkflowService(): WorkflowService {
  if (!workflowService) {
    workflowService = new WorkflowService()
  }
  return workflowService
}
