import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: { emailId: string } }
) {
  try {
    const email = await prisma.emailImport.findUnique({
      where: { id: params.emailId },
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    await prisma.emailImport.update({
      where: { id: params.emailId },
      data: {
        processingStatus: 'PENDING',
        errorMessage: null,
        retryCount: { increment: 1 },
        lastRetryAt: new Date(),
      },
    })

    // Log retry in workflow
    await prisma.workflowLog.create({
      data: {
        emailImportId: params.emailId,
        state: 'EMAIL_RECEIVED',
        message: `Manual retry triggered (attempt ${email.retryCount + 1})`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Retry error:', error)
    return NextResponse.json({ error: 'Failed to queue retry' }, { status: 500 })
  }
}
