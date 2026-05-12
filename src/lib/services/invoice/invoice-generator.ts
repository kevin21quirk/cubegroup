import { InvoiceGenerationData } from '@/types'
import { InvoiceType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generateInvoiceNumber, calculateVAT } from '@/lib/utils'

export class InvoiceGenerator {
  async generateInvoice(data: InvoiceGenerationData) {
    const invoiceNumber = generateInvoiceNumber(
      data.invoiceType === InvoiceType.CLIENT_INVOICE ? 'INV' : 'UMB'
    )

    const subtotal = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    const vatAmount = calculateVAT(subtotal, data.items[0]?.vatRate || 20)
    const totalAmount = subtotal + vatAmount

    const dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    let billingName = ''
    let billingAddress = ''
    let billingPostcode = ''
    let billingCity = ''

    if (data.invoiceType === InvoiceType.CLIENT_INVOICE && data.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: data.companyId },
      })
      
      if (company) {
        billingName = company.name
        billingAddress = company.billingAddress || ''
        billingPostcode = company.billingPostcode || ''
        billingCity = company.billingCity || ''
      }
    } else if (data.invoiceType === InvoiceType.UMBRELLA_INVOICE && data.umbrellaCompanyId) {
      const umbrella = await prisma.umbrellaCompany.findUnique({
        where: { id: data.umbrellaCompanyId },
      })
      
      if (umbrella) {
        billingName = umbrella.name
        billingAddress = umbrella.address || ''
        billingPostcode = umbrella.postcode || ''
        billingCity = umbrella.city || ''
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceType: data.invoiceType,
        companyId: data.companyId,
        umbrellaCompanyId: data.umbrellaCompanyId,
        payrollSubmissionId: data.payrollSubmissionId,
        issueDate: new Date(),
        dueDate,
        subtotal,
        vatAmount,
        totalAmount,
        billingName,
        billingAddress,
        billingPostcode,
        billingCity,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate || 20,
            amount: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return invoice
  }

  async generatePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        company: true,
        umbrellaCompany: true,
      },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    throw new Error('PDF generation not yet implemented. Use a library like pdfkit or puppeteer.')
  }

  async markAsSent(invoiceId: string) {
    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    })
  }

  async markAsPaid(invoiceId: string, paymentAmount: number, paymentDate: Date) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const newPaidAmount = invoice.paidAmount + paymentAmount
    const isPaidInFull = newPaidAmount >= invoice.totalAmount

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: isPaidInFull ? 'PAID' : 'PARTIAL',
        paymentStatus: isPaidInFull ? 'PAID' : 'PARTIAL',
        paidAt: isPaidInFull ? paymentDate : null,
      },
    })
  }
}
