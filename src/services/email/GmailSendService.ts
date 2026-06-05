/**
 * GmailSendService
 * Sends emails via the Gmail API using the existing OAuth credentials.
 * Requires gmail.modify or gmail.send scope (already granted).
 */
import { getGmailService } from './GmailService'

export interface EmailAttachment {
  filename: string
  mimeType: string
  data: Buffer
}

export class GmailSendService {
  private gmail = getGmailService()

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    fromName = 'Cube Group Payroll',
    attachments?: EmailAttachment[],
  ): Promise<void> {
    const gmailClient = await (this.gmail as any).getGmailClient()

    const userInfoRes = await gmailClient.users.getProfile({ userId: 'me' })
    const fromEmail = userInfoRes.data.emailAddress ?? 'me'

    const raw = this.buildRaw(fromEmail, fromName, to, subject, htmlBody, attachments)

    await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })
  }

  private buildRaw(
    fromEmail: string,
    fromName: string,
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): string {
    const headers = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
    ]

    let body: string

    if (!attachments?.length) {
      const b = `boundary_${Date.now()}`
      body = [
        `Content-Type: multipart/alternative; boundary="${b}"`,
        '',
        `--${b}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(html, 'utf-8').toString('base64'),
        '',
        `--${b}--`,
      ].join('\r\n')
    } else {
      const b = `boundary_${Date.now()}`
      const parts: string[] = [
        `Content-Type: multipart/mixed; boundary="${b}"`,
        '',
        `--${b}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(html, 'utf-8').toString('base64'),
        '',
      ]
      for (const att of attachments) {
        parts.push(
          `--${b}`,
          `Content-Type: ${att.mimeType}; name="${att.filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${att.filename}"`,
          '',
          att.data.toString('base64'),
          '',
        )
      }
      parts.push(`--${b}--`)
      body = parts.join('\r\n')
    }

    const mime = [...headers, '', body].join('\r\n')
    return Buffer.from(mime).toString('base64url')
  }
}

let instance: GmailSendService | null = null
export function getGmailSendService(): GmailSendService {
  if (!instance) instance = new GmailSendService()
  return instance
}
