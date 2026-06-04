/**
 * GET /api/cron/gmail
 *
 * Cron route — called by Vercel every 5 minutes (see vercel.json).
 * Polls the Gmail label for new unread messages, ingests them into
 * the database and triggers the EmailProcessingService pipeline.
 *
 * Security: Vercel automatically sends Authorization: Bearer <CRON_SECRET>
 * when CRON_SECRET is set in environment variables.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { getGmailService } from '@/services/email/GmailService'
import { getAttachmentDownloadService } from '@/services/email/AttachmentDownloadService'
import { getEmailProcessingService } from '@/services/email/EmailProcessingService'

export const dynamic = 'force-dynamic'
export const maxDuration = 300   // 5 min Vercel function timeout

// ── Document type detection ───────────────────────────────────────────────────

function detectDocumentType(filename: string): 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':                         return 'PDF'
    case 'doc': case 'docx':           return 'DOCX'
    case 'xls': case 'xlsx':           return 'XLSX'
    case 'csv':                         return 'CSV'
    case 'jpg': case 'jpeg':
    case 'png': case 'gif': case 'bmp': return 'IMAGE'
    default:                            return 'OTHER'
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization')
    const expected   = `Bearer ${env.CRON_SECRET}`
    if (authHeader !== expected) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  const startedAt = Date.now()
  const summary = {
    messagesFound:    0,
    messagesSkipped:  0,   // already in DB
    messagesIngested: 0,
    processingErrors: 0,
    errors:           [] as string[],
  }

  try {
    const gmailService      = getGmailService()
    const downloadService   = getAttachmentDownloadService()
    const processingService = getEmailProcessingService()

    // ── 1. Check Gmail is connected ─────────────────────────────────────────
    const connected = await gmailService.isConnected()
    if (!connected) {
      return NextResponse.json({
        success: false,
        message: 'Gmail not connected. Visit /api/auth/google to authorise.',
      }, { status: 503 })
    }

    // ── 2. Fetch unread message IDs from the monitor label ──────────────────
    const label = env.GMAIL_MONITOR_LABEL
    let messageIds: string[]
    try {
      messageIds = await gmailService.fetchUnreadMessageIds(label)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch messages'
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }

    summary.messagesFound = messageIds.length

    if (messageIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No new messages in label "${label}"`,
        durationMs: Date.now() - startedAt,
        summary,
      })
    }

    // ── 3. Process each message ─────────────────────────────────────────────
    for (const gmailMessageId of messageIds) {
      try {
        // ── 3a. Skip if already imported ──────────────────────────────────
        const existing = await prisma.emailImport.findUnique({
          where: { messageId: gmailMessageId },
        })
        if (existing) {
          summary.messagesSkipped++
          // Still mark as processed in Gmail so it doesn't keep appearing
          await gmailService.markAsProcessed(gmailMessageId).catch(() => {})
          continue
        }

        // ── 3b. Fetch full message from Gmail ─────────────────────────────
        const rawMessage = await gmailService.getMessageDetails(gmailMessageId)
        const parsed     = gmailService.parseMessage(rawMessage)

        // ── 3c. Create EmailImport record ─────────────────────────────────
        const emailImport = await prisma.emailImport.create({
          data: {
            messageId:       parsed.gmailMessageId,
            threadId:        parsed.threadId || null,
            from:            parsed.from,
            to:              parsed.to,
            subject:         parsed.subject,
            bodyText:        parsed.bodyText || null,
            bodyHtml:        parsed.bodyHtml || null,
            receivedAt:      parsed.receivedAt,
            hasAttachments:  parsed.attachments.length > 0,
            attachmentCount: parsed.attachments.length,
            processingStatus: 'PENDING',
          },
        })

        // ── 3d. Create Attachment records ─────────────────────────────────
        for (const att of parsed.attachments) {
          await prisma.attachment.create({
            data: {
              emailImportId:    emailImport.id,
              filename:         att.filename,
              originalFilename: att.filename,
              fileSize:         att.size,
              mimeType:         att.mimeType,
              documentType:     detectDocumentType(att.filename),
              status:           'PENDING',
            },
          })
        }

        // ── 3e. Download attachments ───────────────────────────────────────
        if (parsed.attachments.length > 0) {
          await downloadService.downloadAll(emailImport.id, gmailMessageId, parsed.attachments)
        }

        // ── 3f. Move message to processed label in Gmail ───────────────────
        await gmailService.markAsProcessed(gmailMessageId).catch(err => {
          console.warn('[cron/gmail] markAsProcessed non-fatal error:', err?.message ?? err)
        })

        // ── 3g. Log workflow: email received ──────────────────────────────
        await prisma.workflowLog.create({
          data: {
            emailImportId: emailImport.id,
            state:         'EMAIL_RECEIVED',
            message:       `Email received from ${parsed.from} – ${parsed.attachments.length} attachment(s)`,
          },
        })

        // ── 3h. Trigger async processing pipeline (non-blocking) ──────────
        processingService.processEmail(emailImport.id).catch(err => {
          console.error(`[cron/gmail] Processing failed for ${emailImport.id}:`, err)
        })

        summary.messagesIngested++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[cron/gmail] Error processing message ${gmailMessageId}:`, msg)
        summary.processingErrors++
        summary.errors.push(`${gmailMessageId}: ${msg}`)

        // Mark unread removed so we don't retry forever in same run
        await gmailService.markAsFailed(gmailMessageId).catch(() => {})
      }
    }

    return NextResponse.json({
      success:    true,
      durationMs: Date.now() - startedAt,
      label,
      summary,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Cron job failed'
    console.error('[cron/gmail] Fatal error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
