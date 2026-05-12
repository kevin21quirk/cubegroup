import { WorkflowState } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { WorkflowTransition } from '@/types'

export class WorkflowEngine {
  private validTransitions: Map<WorkflowState, WorkflowState[]>

  constructor() {
    this.validTransitions = new Map([
      [WorkflowState.EMAIL_RECEIVED, [WorkflowState.PROCESSING, WorkflowState.FAILED]],
      [WorkflowState.PROCESSING, [WorkflowState.AWAITING_VALIDATION, WorkflowState.FAILED]],
      [WorkflowState.AWAITING_VALIDATION, [WorkflowState.READY_FOR_INVOICE, WorkflowState.PROCESSING, WorkflowState.FAILED]],
      [WorkflowState.READY_FOR_INVOICE, [WorkflowState.INVOICE_SENT, WorkflowState.FAILED]],
      [WorkflowState.INVOICE_SENT, [WorkflowState.AWAITING_PAYMENT, WorkflowState.FAILED]],
      [WorkflowState.AWAITING_PAYMENT, [WorkflowState.PAYMENT_RECEIVED, WorkflowState.FAILED]],
      [WorkflowState.PAYMENT_RECEIVED, [WorkflowState.UMBRELLA_INVOICE_SENT, WorkflowState.FAILED]],
      [WorkflowState.UMBRELLA_INVOICE_SENT, [WorkflowState.COMPLETED, WorkflowState.FAILED]],
      [WorkflowState.FAILED, [WorkflowState.PROCESSING]],
      [WorkflowState.COMPLETED, []],
    ])
  }

  canTransition(from: WorkflowState, to: WorkflowState): boolean {
    const allowed = this.validTransitions.get(from)
    return allowed ? allowed.includes(to) : false
  }

  async transitionPayrollSubmission(
    submissionId: string,
    transition: WorkflowTransition,
    userId: string
  ): Promise<void> {
    const submission = await prisma.payrollSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      throw new Error('Payroll submission not found')
    }

    if (!this.canTransition(submission.workflowState, transition.to)) {
      throw new Error(
        `Invalid transition from ${submission.workflowState} to ${transition.to}`
      )
    }

    await prisma.$transaction([
      prisma.payrollSubmission.update({
        where: { id: submissionId },
        data: {
          workflowState: transition.to,
          processedAt: transition.to === WorkflowState.COMPLETED ? new Date() : undefined,
        },
      }),
      prisma.activity.create({
        data: {
          action: 'WORKFLOW_TRANSITION',
          description: `Transitioned from ${transition.from} to ${transition.to}`,
          entityType: 'PayrollSubmission',
          entityId: submissionId,
          userId,
          payrollSubmissionId: submissionId,
          metadata: {
            from: transition.from,
            to: transition.to,
            reason: transition.reason,
            ...transition.metadata,
          },
        },
      }),
    ])
  }

  async getNextState(currentState: WorkflowState): WorkflowState | null {
    const transitions = this.validTransitions.get(currentState)
    if (!transitions || transitions.length === 0) {
      return null
    }
    return transitions[0]
  }

  async autoProgress(submissionId: string, userId: string): Promise<void> {
    const submission = await prisma.payrollSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      throw new Error('Payroll submission not found')
    }

    const nextState = await this.getNextState(submission.workflowState)
    
    if (nextState) {
      await this.transitionPayrollSubmission(
        submissionId,
        {
          from: submission.workflowState,
          to: nextState,
          reason: 'Auto-progression',
        },
        userId
      )
    }
  }

  async getWorkflowStats() {
    const stats = await prisma.payrollSubmission.groupBy({
      by: ['workflowState'],
      _count: true,
    })

    return stats.reduce((acc, stat) => {
      acc[stat.workflowState] = stat._count
      return acc
    }, {} as Record<WorkflowState, number>)
  }
}
