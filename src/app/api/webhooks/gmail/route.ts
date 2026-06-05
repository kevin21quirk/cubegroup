import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmailProcessingService } from '@/services/email/EmailProcessingService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract email data from webhook payload
    const {
      messageId,
      threadId,
      from,
      to,
      subject,
      bodyText,
      bodyHtml,
      receivedAt,
      attachments = []
    } = body

    // Validate required fields
    if (!messageId || !from || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.emailImport.findUnique({
      where: { messageId }
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Email already processed', emailImportId: existing.id },
        { status: 200 }
      )
    }

    // Create email import record
    const emailImport = await prisma.emailImport.create({
      data: {
        messageId,
        threadId,
        from,
        to,
        subject,
        bodyText,
        bodyHtml,
        receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
        hasAttachments: attachments.length > 0,
        attachmentCount: attachments.length,
        processingStatus: 'PENDING'
      }
    })

    // Create attachment records
    for (const attachment of attachments) {
      await prisma.attachment.create({
        data: {
          emailImportId: emailImport.id,
          filename: attachment.filename,
          originalFilename: attachment.filename,
          fileSize: attachment.size || 0,
          mimeType: attachment.mimeType || 'application/octet-stream',
          documentType: detectDocumentType(attachment.filename),
          status: 'PENDING'
        }
      })
    }

    // Process synchronously within the function lifetime
    const processingService = getEmailProcessingService()
    let processingResult: { success: boolean; error?: string } = { success: false }
    try {
      processingResult = await processingService.processEmail(emailImport.id)
    } catch (error) {
      console.error('Email processing error:', error)
    }

    return NextResponse.json({
      success: true,
      emailImportId: emailImport.id,
      processed: processingResult.success,
      message: processingResult.success ? 'Email processed' : 'Email received; processing failed: ' + processingResult.error,
    })
  } catch (error) {
    console.error('Gmail webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function detectDocumentType(filename: string): 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'IMAGE' | 'OTHER' {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'pdf':
      return 'PDF'
    case 'docx':
    case 'doc':
      return 'DOCX'
    case 'xlsx':
    case 'xls':
      return 'XLSX'
    case 'csv':
      return 'CSV'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'IMAGE'
    default:
      return 'OTHER'
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 300
