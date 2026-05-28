/**
 * XeroService – integrates with Xero accounting via xero-node SDK.
 * Handles OAuth2 token management, contact creation and invoice/bill pushing.
 */
import { XeroClient, Contact, Invoice, LineItem, Invoices, Contacts } from 'xero-node'
import { prisma } from '@/lib/prisma'

export interface AccountingContact {
  name: string
  email?: string
  phone?: string
  addressLine1?: string
  city?: string
  postcode?: string
}

export interface AccountingLineItem {
  description: string
  quantity: number
  unitAmount: number
  accountCode?: string
  taxType?: string
}

export interface AccountingInvoice {
  contactName: string
  contactEmail?: string
  invoiceNumber?: string
  reference?: string
  date: Date
  dueDate?: Date
  lineItems: AccountingLineItem[]
  currencyCode?: string
}

export interface AccountingResult {
  success: boolean
  externalId?: string
  externalRef?: string
  error?: string
}

export class XeroService {
  private xero: XeroClient

  constructor() {
    this.xero = new XeroClient({
      clientId:     process.env.XERO_CLIENT_ID     || '',
      clientSecret: process.env.XERO_CLIENT_SECRET || '',
      redirectUris: [process.env.XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/xero/callback`],
      scopes:       ['openid', 'profile', 'email', 'accounting.transactions', 'accounting.contacts', 'offline_access'],
    })
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────
  getAuthUrl(state: string): string {
    const url = this.xero.buildConsentUrl()
    return `${url}&state=${encodeURIComponent(state)}`
  }

  async handleCallback(code: string): Promise<{ tenantId: string; refreshToken: string }> {
    await this.xero.apiCallback(code)
    const tokenSet = await this.xero.readTokenSet()
    await this.xero.updateTenants(false)
    const tenant = this.xero.tenants[0]
    return { tenantId: tenant.tenantId, refreshToken: tokenSet.refresh_token || '' }
  }

  private async authenticate(tenantId: string, refreshToken: string): Promise<void> {
    await this.xero.refreshWithRefreshToken(
      process.env.XERO_CLIENT_ID     || '',
      process.env.XERO_CLIENT_SECRET || '',
      refreshToken
    )
  }

  // ── Contact (worker or agency) ─────────────────────────────────────────────
  async createOrUpdateContact(
    tenantId: string,
    refreshToken: string,
    contact: AccountingContact
  ): Promise<AccountingResult> {
    try {
      await this.authenticate(tenantId, refreshToken)

      const xeroContact: Contact = {
        name: contact.name,
        emailAddress: contact.email,
        phones: contact.phone ? [{ phoneType: 'DEFAULT' as any, phoneNumber: contact.phone }] : [],
        addresses: contact.addressLine1 ? [{
          addressType: 'STREET' as any,
          addressLine1: contact.addressLine1,
          city: contact.city,
          postalCode: contact.postcode,
        }] : [],
      }

      // Check if contact exists
      const existing = await this.xero.accountingApi.getContacts(
        tenantId, undefined, `Name="${contact.name}"`
      )
      const contacts: Contacts = existing.body

      let result: Contact
      if (contacts.contacts && contacts.contacts.length > 0) {
        const existingContact = contacts.contacts[0]
        const updated = await this.xero.accountingApi.updateContact(tenantId, existingContact.contactID!, { contacts: [{ ...existingContact, ...xeroContact }] })
        result = updated.body.contacts![0]
      } else {
        const created = await this.xero.accountingApi.createContacts(tenantId, { contacts: [xeroContact] })
        result = created.body.contacts![0]
      }

      return { success: true, externalId: result.contactID, externalRef: result.name }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Xero contact error' }
    }
  }

  // ── Invoice (sales invoice from Cube to agency) ───────────────────────────
  async createInvoice(
    tenantId: string,
    refreshToken: string,
    invoice: AccountingInvoice
  ): Promise<AccountingResult> {
    try {
      await this.authenticate(tenantId, refreshToken)

      const lineItems: LineItem[] = invoice.lineItems.map(li => ({
        description: li.description,
        quantity: li.quantity,
        unitAmount: li.unitAmount,
        accountCode: li.accountCode || process.env.XERO_DEFAULT_INCOME_ACCOUNT || '200',
        taxType: li.taxType || 'OUTPUT2',
      }))

      const xeroInvoice: Invoice = {
        type: Invoice.TypeEnum.ACCREC,
        contact: { name: invoice.contactName },
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        date: invoice.date.toISOString().split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
        lineItems,
        currencyCode: (invoice.currencyCode || 'GBP') as any,
        status: Invoice.StatusEnum.AUTHORISED,
      }

      const response = await this.xero.accountingApi.createInvoices(tenantId, { invoices: [xeroInvoice] })
      const created: Invoice = response.body.invoices![0]

      return { success: true, externalId: created.invoiceID, externalRef: created.invoiceNumber }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Xero invoice error' }
    }
  }

  // ── Bill (purchase invoice – cost from agency to Cube) ───────────────────
  async createBill(
    tenantId: string,
    refreshToken: string,
    invoice: AccountingInvoice
  ): Promise<AccountingResult> {
    try {
      await this.authenticate(tenantId, refreshToken)

      const lineItems: LineItem[] = invoice.lineItems.map(li => ({
        description: li.description,
        quantity: li.quantity,
        unitAmount: li.unitAmount,
        accountCode: li.accountCode || process.env.XERO_DEFAULT_EXPENSE_ACCOUNT || '400',
        taxType: li.taxType || 'INPUT2',
      }))

      const xeroBill: Invoice = {
        type: Invoice.TypeEnum.ACCPAY,
        contact: { name: invoice.contactName },
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        date: invoice.date.toISOString().split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
        lineItems,
        currencyCode: (invoice.currencyCode || 'GBP') as any,
        status: Invoice.StatusEnum.AUTHORISED,
      }

      const response = await this.xero.accountingApi.createInvoices(tenantId, { invoices: [xeroBill] })
      const created: Invoice = response.body.invoices![0]

      return { success: true, externalId: created.invoiceID, externalRef: created.invoiceNumber }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Xero bill error' }
    }
  }
}

let xeroService: XeroService | null = null
export function getXeroService(): XeroService {
  if (!xeroService) xeroService = new XeroService()
  return xeroService
}
