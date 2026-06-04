/**
 * AttachmentDownloadService
 * Downloads Gmail attachments to local temp storage and records
 * them in the database with their paths.
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { getGmailService, GmailAttachmentMeta } from './GmailService'

export interface DownloadResult {
  attachmentId: string   // DB Attachment.id
  filename:     string
  localPath:    string
  success:      boolean
  error?:       string
}

export class AttachmentDownloadService {
  private gmail = getGmailService()

  /**
   * Downloads all attachments for a Gmail message and writes them to
   * OS temp dir.  Updates each Attachment record in the database with
   * the local path so EmailProcessingService can read them.
   *
   * @param emailImportId  - DB EmailImport.id
   * @param gmailMessageId - Gmail message ID (e.g. "18b3c1d4e5f")
   * @param attachments    - metadata returned by GmailService.parseMessage()
   */
  async downloadAll(
    emailImportId:  string,
    gmailMessageId: string,
    attachments:    GmailAttachmentMeta[],
  ): Promise<DownloadResult[]> {
    const results: DownloadResult[] = []

    // Find the matching Attachment DB records (created in cron before calling this)
    const dbAttachments = await prisma.attachment.findMany({
      where: { emailImportId },
    })

    for (const meta of attachments) {
      // Match by filename
      const dbRecord = dbAttachments.find(a => a.originalFilename === meta.filename)
      if (!dbRecord) continue

      try {
        // Download bytes from Gmail
        const buffer = await this.gmail.downloadAttachmentBuffer(gmailMessageId, meta.gmailAttachmentId)

        // Write to OS temp dir with a unique prefix to avoid collisions
        const safeName  = meta.filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const localPath = path.join(os.tmpdir(), `cube_${emailImportId.slice(-6)}_${safeName}`)
        fs.writeFileSync(localPath, buffer)

        // Persist raw content in DB so processEmail can read it even
        // after the temp file is gone (Vercel serverless: /tmp is ephemeral)
        const isTextBased = /\.(csv|txt|json|tsv)$/i.test(meta.filename)
          || meta.mimeType.startsWith('text/')
        const rawContent = isTextBased
          ? buffer.toString('utf-8').slice(0, 500_000)
          : buffer.toString('base64').slice(0, 500_000)

        // Update DB record
        await prisma.attachment.update({
          where: { id: dbRecord.id },
          data: {
            localPath,
            extractedText: rawContent,
            status:        'DOWNLOADED',
            downloadedAt:  new Date(),
          },
        })

        results.push({ attachmentId: dbRecord.id, filename: meta.filename, localPath, success: true })
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Download failed'

        await prisma.attachment.update({
          where: { id: dbRecord.id },
          data: { status: 'FAILED', errorMessage: error },
        })

        results.push({ attachmentId: dbRecord.id, filename: meta.filename, localPath: '', success: false, error })
      }
    }

    return results
  }
}

let instance: AttachmentDownloadService | null = null
export function getAttachmentDownloadService(): AttachmentDownloadService {
  if (!instance) instance = new AttachmentDownloadService()
  return instance
}
