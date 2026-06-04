/**
 * GmailSendService
 * Sends emails via the Gmail API using the existing OAuth credentials.
 * Requires gmail.modify or gmail.send scope (already granted).
 */
import { getGmailService } from './GmailService'

export class GmailSendService {
  private gmail = getGmailService()

  async sendEmail(to: string, subject: string, htmlBody: string, fromName = 'Cube Group Payroll'): Promise<void> {
    const gmailClient = await (this.gmail as any).getGmailClient()

    const userInfoRes = await gmailClient.users.getProfile({ userId: 'me' })
    const fromEmail = userInfoRes.data.emailAddress ?? 'me'

    const raw = this.buildRaw(fromEmail, fromName, to, subject, htmlBody)

    await gmailClient.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    })
  }

  private buildRaw(fromEmail: string, fromName: string, to: string, subject: string, html: string): string {
    const boundary = `boundary_${Date.now()}`
    const mime = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(html, 'utf-8').toString('base64'),
      '',
      `--${boundary}--`,
    ].join('\r\n')

    return Buffer.from(mime).toString('base64url')
  }
}

let instance: GmailSendService | null = null
export function getGmailSendService(): GmailSendService {
  if (!instance) instance = new GmailSendService()
  return instance
}
