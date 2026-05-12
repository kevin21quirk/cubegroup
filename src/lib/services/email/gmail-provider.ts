import { google } from 'googleapis'
import { EmailProvider, EmailMessage, EmailFetchOptions, EmailAttachment } from '@/types'

export class GmailProvider implements EmailProvider {
  private gmail: any
  private auth: any

  constructor() {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
  }

  async connect(): Promise<void> {
    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
  }

  setCredentials(tokens: any) {
    this.auth.setCredentials(tokens)
  }

  async fetchMessages(options?: EmailFetchOptions): Promise<EmailMessage[]> {
    if (!this.gmail) {
      await this.connect()
    }

    let query = ''
    
    if (options?.from) {
      query += `from:${options.from} `
    }
    
    if (options?.subject) {
      query += `subject:${options.subject} `
    }
    
    if (options?.hasAttachment) {
      query += 'has:attachment '
    }
    
    if (options?.after) {
      const date = Math.floor(options.after.getTime() / 1000)
      query += `after:${date} `
    }

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query.trim(),
      maxResults: options?.maxResults || 50,
    })

    const messages: EmailMessage[] = []
    
    if (response.data.messages) {
      for (const msg of response.data.messages) {
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
        })
        
        const parsed = await this.parseMessage(fullMessage.data)
        messages.push(parsed)
      }
    }

    return messages
  }

  async watchInbox(callback: (message: EmailMessage) => void): Promise<void> {
    throw new Error('Gmail watch not yet implemented. Use polling or webhooks.')
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: EmailAttachment[]
  ): Promise<void> {
    if (!this.gmail) {
      await this.connect()
    }

    const message = this.createMessage(to, subject, body, attachments)
    
    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
      },
    })
  }

  private async parseMessage(data: any): Promise<EmailMessage> {
    const headers = data.payload.headers
    const messageId = data.id
    const threadId = data.threadId
    
    const from = headers.find((h: any) => h.name === 'From')?.value || ''
    const to = headers.find((h: any) => h.name === 'To')?.value || ''
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
    const dateStr = headers.find((h: any) => h.name === 'Date')?.value || ''
    
    const receivedAt = new Date(dateStr)
    
    let bodyText = ''
    let bodyHtml = ''
    
    if (data.payload.parts) {
      for (const part of data.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.mimeType === 'text/html' && part.body.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    } else if (data.payload.body.data) {
      bodyText = Buffer.from(data.payload.body.data, 'base64').toString('utf-8')
    }

    const attachments: EmailAttachment[] = []
    
    if (data.payload.parts) {
      for (const part of data.payload.parts) {
        if (part.filename && part.body.attachmentId) {
          const attachment = await this.gmail.users.messages.attachments.get({
            userId: 'me',
            messageId: messageId,
            id: part.body.attachmentId,
          })
          
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
            data: Buffer.from(attachment.data.data, 'base64'),
          })
        }
      }
    }

    return {
      messageId,
      threadId,
      from,
      to,
      subject,
      bodyText,
      bodyHtml,
      receivedAt,
      attachments,
    }
  }

  private createMessage(
    to: string,
    subject: string,
    body: string,
    attachments?: EmailAttachment[]
  ): string {
    const boundary = '----=_Part_' + Date.now()
    
    let message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      '',
      body,
    ].join('\r\n')

    if (attachments) {
      for (const attachment of attachments) {
        message += `\r\n--${boundary}\r\n`
        message += `Content-Type: ${attachment.mimeType}\r\n`
        message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`
        message += 'Content-Transfer-Encoding: base64\r\n\r\n'
        message += attachment.data.toString('base64')
      }
    }

    message += `\r\n--${boundary}--`
    
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
}
