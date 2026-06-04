import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailProcessingService } from '@/services/email/EmailProcessingService'
import { getGmailService } from '@/services/email/GmailService'
import fs from 'fs'
import os from 'os'
import path from 'path'

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

    // ── Re-download any attachments that are missing content ───────────────
    // Temp files (/tmp) are ephemeral on Vercel — re-fetch from Gmail if needed.
    if (email.messageId) {
      const attachments = await prisma.attachment.findMany({ where: { emailImportId: emailId } })
      const needsRedownload = attachments.filter(a => !a.extractedText)

      if (needsRedownload.length > 0) {
        try {
          const gmail = getGmailService()
          const raw = await gmail.getMessageDetails(email.messageId)
          const parsed = gmail.parseMessage(raw)

          for (const att of needsRedownload) {
            const meta = parsed.attachments.find(m => m.filename === att.originalFilename)
            if (!meta) continue
            try {
              const buffer = meta.inlineData
                  ? Buffer.from(meta.inlineData.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
                  : await gmail.downloadAttachmentBuffer(email.messageId, meta.gmailAttachmentId)
              const safeName = att.originalFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
              const localPath = path.join(os.tmpdir(), `cube_retry_${emailId.slice(-6)}_${safeName}`)
              fs.writeFileSync(localPath, buffer)
              const isTextBased = /\.(csv|txt|json|tsv)$/i.test(att.originalFilename)
              const rawContent = isTextBased
                ? buffer.toString('utf-8').slice(0, 500_000)
                : buffer.toString('base64').slice(0, 500_000)
              await prisma.attachment.update({
                where: { id: att.id },
                data: { localPath, extractedText: rawContent, status: 'DOWNLOADED', downloadedAt: new Date() },
              })
            } catch { /* skip this attachment */ }
          }
        } catch { /* Gmail re-download failed — proceed anyway */ }
      }
    }

    // Actually run the processing pipeline
    const result = await getEmailProcessingService().processEmail(emailId)

    return NextResponse.json({ success: result.success, state: result.state, error: result.error })
  } catch (error) {
    console.error('Retry error:', error)
    return NextResponse.json({ error: 'Failed to queue retry' }, { status: 500 })
  }
}
