import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailProcessingService } from '@/services/email/EmailProcessingService'

export const maxDuration = 300

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params
  try {
    const email = await prisma.emailImport.findUnique({
      where: { id: emailId },
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Reset status so the pipeline can run from the start
    await prisma.emailImport.update({
      where: { id: emailId },
      data: {
        processingStatus: 'PENDING',
        errorMessage: null,
        isProcessed: false,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    })

    await prisma.workflowLog.create({
      data: {
        emailImportId: emailId,
        state: 'EMAIL_RECEIVED',
        message: `Manual retry triggered (attempt ${(email.retryCount ?? 0) + 1})`,
      },
    })

    // processEmail is self-healing: it will re-download from Gmail if content is missing
    // Run the processing pipeline
    const result = await getEmailProcessingService().processEmail(emailId)

    return NextResponse.json({ success: result.success, state: result.state, error: result.error })
  } catch (error) {
    console.error('Retry error:', error)
    return NextResponse.json({ error: 'Failed to queue retry' }, { status: 500 })
  }
}
