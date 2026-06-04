/**
 * GmailService
 * Handles all Gmail API interactions: OAuth2 auth, label polling,
 * message parsing, attachment downloading, and label management.
 */
import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedMessage {
  gmailMessageId: string
  threadId: string
  from: string
  to: string
  subject: string
  receivedAt: Date
  bodyText: string
  bodyHtml: string
  attachments: GmailAttachmentMeta[]
}

export interface GmailAttachmentMeta {
  filename: string
  mimeType: string
  size: number
  gmailAttachmentId: string   // Gmail internal attachment ID (needed to download)
  inlineData?: string         // base64url-encoded data for small inline attachments
}

// ── Service ──────────────────────────────────────────────────────────────────

export class GmailService {
  // ── OAuth2 client factory ─────────────────────────────────────────────────

  private createOAuthClient(): OAuth2Client {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured')
    }
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI || `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    )
  }

  /**
   * Generates the Google OAuth2 authorisation URL.
   * Redirect the admin browser here to grant Gmail access.
   */
  getAuthUrl(): string {
    const client = this.createOAuthClient()
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',           // force refresh_token to be returned every time
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',   // needed to apply labels
        'https://www.googleapis.com/auth/gmail.labels',
      ],
    })
  }

  /**
   * Exchanges an authorisation code for tokens and persists the
   * refresh token in the SystemConfig table.
   * Returns the access token (short-lived, only used here).
   */
  async exchangeCode(code: string): Promise<{ email: string; expiryDate: number | null | undefined }> {
    const client = this.createOAuthClient()
    const { tokens } = await client.getToken(code)
    if (!tokens.refresh_token) {
      throw new Error('No refresh_token returned. Ensure you are using prompt=consent and access_type=offline.')
    }

    // Persist refresh token in DB (survives redeployments)
    await prisma.systemConfig.upsert({
      where:  { key: 'GOOGLE_REFRESH_TOKEN' },
      create: { key: 'GOOGLE_REFRESH_TOKEN', value: tokens.refresh_token, description: 'Gmail OAuth2 refresh token' },
      update: { value: tokens.refresh_token },
    })

    // Also try to get the email address for confirmation (non-critical)
    client.setCredentials(tokens)
    let email = env.GMAIL_MONITOR_EMAIL || 'unknown'
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client })
      const userInfo = await oauth2.userinfo.get()
      email = userInfo.data.email || email
    } catch (emailErr) {
      console.warn('[GmailService] Could not fetch email from userinfo, using fallback:', emailErr)
    }

    await prisma.systemConfig.upsert({
      where:  { key: 'GOOGLE_CONNECTED_EMAIL' },
      create: { key: 'GOOGLE_CONNECTED_EMAIL', value: email, description: 'Gmail account connected via OAuth' },
      update: { value: email },
    })

    return { email, expiryDate: tokens.expiry_date }
  }

  /**
   * Returns an authenticated Gmail API client.
   * Reads refresh token from DB first, falls back to env var.
   */
  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const client = this.createOAuthClient()

    // Prefer DB-stored token (survives redeployment)
    const stored = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_REFRESH_TOKEN' } })
    const refreshToken = stored?.value || env.GOOGLE_REFRESH_TOKEN

    if (!refreshToken) {
      throw new Error('Gmail not authorised. Visit /api/auth/google to connect your Gmail account.')
    }

    client.setCredentials({ refresh_token: refreshToken })
    return google.gmail({ version: 'v1', auth: client })
  }

  /** Returns true if a refresh token is stored and Gmail is usable. */
  async isConnected(): Promise<boolean> {
    try {
      const stored = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_REFRESH_TOKEN' } })
      return !!(stored?.value || env.GOOGLE_REFRESH_TOKEN)
    } catch {
      return false
    }
  }

  /** Returns the connected Gmail address from DB, or null. */
  async getConnectedEmail(): Promise<string | null> {
    const stored = await prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CONNECTED_EMAIL' } })
    return stored?.value || env.GMAIL_MONITOR_EMAIL || null
  }

  // ── Label helpers ─────────────────────────────────────────────────────────

  /** Resolves a label name to its Gmail label ID, creating it if missing. */
  private async resolveLabel(gmail: gmail_v1.Gmail, labelName: string): Promise<string> {
    const res = await gmail.users.labels.list({ userId: 'me' })
    const existing = res.data.labels?.find(l => l.name === labelName)
    if (existing?.id) return existing.id

    // Create the label if it doesn't exist
    const created = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    })
    return created.data.id!
  }

  // ── Message fetching ──────────────────────────────────────────────────────

  /**
   * Returns Gmail message IDs from the monitor label.
   * Only fetches unread messages to prevent re-processing.
   */
  async fetchUnreadMessageIds(labelName: string = env.GMAIL_MONITOR_LABEL): Promise<string[]> {
    const gmail = await this.getGmailClient()
    const labelId = await this.resolveLabel(gmail, labelName)

    const res = await gmail.users.messages.list({
      userId:   'me',
      labelIds: [labelId, 'UNREAD'],
      maxResults: 50,
    })

    return (res.data.messages || []).map(m => m.id!).filter(Boolean)
  }

  /**
   * Fetches the full message payload for a given Gmail message ID.
   */
  async getMessageDetails(messageId: string): Promise<gmail_v1.Schema$Message> {
    const gmail = await this.getGmailClient()
    const res = await gmail.users.messages.get({
      userId: 'me',
      id:     messageId,
      format: 'full',
    })
    return res.data
  }

  // ── Message parsing ───────────────────────────────────────────────────────

  /**
   * Parses raw Gmail message into a clean `ParsedMessage` object.
   */
  parseMessage(message: gmail_v1.Schema$Message): ParsedMessage {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) =>
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

    return {
      gmailMessageId: message.id!,
      threadId:       message.threadId || '',
      from:           getHeader('From'),
      to:             getHeader('To'),
      subject:        getHeader('Subject'),
      receivedAt:     new Date(parseInt(message.internalDate || `${Date.now()}`, 10)),
      bodyText:       this.extractBodyPart(message.payload, 'text/plain'),
      bodyHtml:       this.extractBodyPart(message.payload, 'text/html'),
      attachments:    this.extractAttachmentMeta(message.payload),
    }
  }

  private extractBodyPart(payload: gmail_v1.Schema$MessagePart | undefined, mimeType: string): string {
    if (!payload) return ''

    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const text = this.extractBodyPart(part, mimeType)
        if (text) return text
      }
    }
    return ''
  }

  private extractAttachmentMeta(
    payload: gmail_v1.Schema$MessagePart | undefined,
    result: GmailAttachmentMeta[] = [],
  ): GmailAttachmentMeta[] {
    if (!payload) return result

    if (payload.filename && (payload.body?.attachmentId || payload.body?.data)) {
      result.push({
        filename:          payload.filename,
        mimeType:          payload.mimeType || 'application/octet-stream',
        size:              payload.body?.size || 0,
        gmailAttachmentId: payload.body?.attachmentId || '',
        inlineData:        payload.body?.data || undefined,
      })
    }

    for (const part of payload.parts || []) {
      this.extractAttachmentMeta(part, result)
    }

    return result
  }

  // ── Attachment downloading ────────────────────────────────────────────────

  /**
   * Downloads attachment bytes from Gmail.
   * Returns a Buffer ready to be written to disk or uploaded to storage.
   */
  async downloadAttachmentBuffer(messageId: string, attachmentId: string): Promise<Buffer> {
    const gmail = await this.getGmailClient()
    const res = await gmail.users.messages.attachments.get({
      userId:    'me',
      messageId,
      id:        attachmentId,
    })

    const data = res.data.data
    if (!data) throw new Error(`No data for attachment ${attachmentId}`)

    // Gmail uses URL-safe base64 (replace - → + and _ → /)
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  }

  // ── Label management ──────────────────────────────────────────────────────

  /**
   * Moves a message from the source label to the processed label
   * and removes the UNREAD label.
   */
  async markAsProcessed(
    messageId:      string,
    fromLabelName:  string = env.GMAIL_MONITOR_LABEL,
    toLabelName:    string = env.GMAIL_PROCESSED_LABEL,
  ): Promise<void> {
    const gmail = await this.getGmailClient()
    const [fromId, toId] = await Promise.all([
      this.resolveLabel(gmail, fromLabelName),
      this.resolveLabel(gmail, toLabelName),
    ])

    // Critical: move to Payroll-Processed and mark as read
    await gmail.users.messages.modify({
      userId: 'me',
      id:     messageId,
      requestBody: {
        addLabelIds:    [toId],
        removeLabelIds: [fromId, 'UNREAD'],
      },
    })

    // Best-effort: add INBOX so the email stays visible in the main mailbox.
    // Done as a separate call so any failure here cannot block email ingestion.
    await gmail.users.messages.modify({
      userId: 'me',
      id:     messageId,
      requestBody: { addLabelIds: ['INBOX'] },
    }).catch(err => {
      console.warn('[GmailService] Could not add INBOX label (non-fatal):', err?.message ?? err)
    })
  }

  /**
   * Marks a message as having failed processing.
   * Removes UNREAD so it won't be picked up again in the same run.
   * Does NOT move it to Processed so a human can review.
   */
  async markAsFailed(messageId: string): Promise<void> {
    const gmail = await this.getGmailClient()
    await gmail.users.messages.modify({
      userId: 'me',
      id:     messageId,
      requestBody: { removeLabelIds: ['UNREAD'] },
    })
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let instance: GmailService | null = null
export function getGmailService(): GmailService {
  if (!instance) instance = new GmailService()
  return instance
}
