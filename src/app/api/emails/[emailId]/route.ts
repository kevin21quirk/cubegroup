/**
 * DELETE /api/emails/[emailId]
 * Deletes an EmailImport and all associated records.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params

  try {
    // Delete in dependency order to avoid FK violations
    const submission = await prisma.payrollSubmission.findFirst({
      where: { emailImportId: emailId },
      select: { id: true },
    })

    if (submission) {
      await prisma.validationError.deleteMany({ where: { payrollSubmissionId: submission.id } })
      await prisma.payrollEntry.deleteMany({ where: { payrollSubmissionId: submission.id } })
      await prisma.generatedSpreadsheet.deleteMany({ where: { payrollSubmissionId: submission.id } })
      await prisma.payrollSubmission.delete({ where: { id: submission.id } })
    }

    await prisma.attachment.deleteMany({ where: { emailImportId: emailId } })
    await prisma.emailImport.delete({ where: { id: emailId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    console.error('[DELETE email]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
