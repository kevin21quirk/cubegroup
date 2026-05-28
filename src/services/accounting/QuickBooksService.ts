/**
 * QuickBooksService – integrates with Intuit QuickBooks Online via intuit-oauth + direct REST API.
 * Handles OAuth2, vendor creation, bill creation and invoice creation.
 */
import OAuthClient from 'intuit-oauth'
import { AccountingContact, AccountingInvoice, AccountingResult } from './XeroService'

const QB_BASE = 'https://quickbooks.api.intuit.com/v3/company'
const QB_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company'

export class QuickBooksService {
  private oauthClient: OAuthClient

  constructor() {
    this.oauthClient = new OAuthClient({
      clientId:     process.env.QUICKBOOKS_CLIENT_ID     || '',
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
      environment:  (process.env.QUICKBOOKS_ENV || 'production') as 'sandbox' | 'production',
      redirectUri:  process.env.QUICKBOOKS_REDIRECT_URI  || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/quickbooks/callback`,
    })
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────
  getAuthUrl(state: string): string {
    return this.oauthClient.authorizeUri({ scope: [OAuthClient.scopes.Accounting], state })
  }

  async handleCallback(url: string): Promise<{ realmId: string; refreshToken: string }> {
    const authResponse = await this.oauthClient.createToken(url)
    const token = authResponse.getJson()
    const realmId = new URL(url).searchParams.get('realmId') || ''
    return { realmId, refreshToken: token.refresh_token || '' }
  }

  private async refreshAndGetToken(refreshToken: string): Promise<string> {
    await this.oauthClient.refreshUsingToken(refreshToken)
    return this.oauthClient.getToken().access_token || ''
  }

  private baseUrl(realmId: string): string {
    return `${process.env.QUICKBOOKS_ENV === 'sandbox' ? QB_SANDBOX : QB_BASE}/${realmId}`
  }

  private async apiRequest(
    method: 'GET' | 'POST',
    url: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`QuickBooks API error ${res.status}: ${err}`)
    }
    return res.json()
  }

  // ── Customer (agency/client) ───────────────────────────────────────────────
  async createOrUpdateCustomer(
    realmId: string,
    refreshToken: string,
    contact: AccountingContact
  ): Promise<AccountingResult> {
    try {
      const accessToken = await this.refreshAndGetToken(refreshToken)
      const base = this.baseUrl(realmId)

      // Search for existing customer
      const query = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${contact.name.replace(/'/g, "\\'")}'`)
      const searchRes = await this.apiRequest('GET', `${base}/query?query=${query}&minorversion=65`, accessToken)
      const existing = searchRes.QueryResponse?.Customer?.[0]

      const customerData: any = {
        DisplayName: contact.name,
        PrimaryEmailAddr: contact.email ? { Address: contact.email } : undefined,
        PrimaryPhone:     contact.phone ? { FreeFormNumber: contact.phone } : undefined,
        BillAddr: contact.addressLine1 ? {
          Line1: contact.addressLine1,
          City:  contact.city,
          PostalCode: contact.postcode,
          Country: 'GB',
        } : undefined,
      }

      let result: any
      if (existing) {
        result = await this.apiRequest('POST', `${base}/customer?minorversion=65`, accessToken, {
          ...existing, ...customerData, sparse: true,
        })
        result = result.Customer
      } else {
        result = await this.apiRequest('POST', `${base}/customer?minorversion=65`, accessToken, customerData)
        result = result.Customer
      }

      return { success: true, externalId: String(result.Id), externalRef: result.DisplayName }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'QuickBooks customer error' }
    }
  }

  // ── Invoice (sales invoice from Cube to agency) ───────────────────────────
  async createInvoice(
    realmId: string,
    refreshToken: string,
    invoice: AccountingInvoice
  ): Promise<AccountingResult> {
    try {
      const accessToken = await this.refreshAndGetToken(refreshToken)
      const base = this.baseUrl(realmId)

      // Find or create customer
      const custResult = await this.createOrUpdateCustomer(realmId, refreshToken, { name: invoice.contactName, email: invoice.contactEmail })
      if (!custResult.success) throw new Error(custResult.error)

      const lines = invoice.lineItems.map((li, idx) => ({
        Id: String(idx + 1),
        Amount: li.quantity * li.unitAmount,
        DetailType: 'SalesItemLineDetail',
        Description: li.description,
        SalesItemLineDetail: {
          Qty: li.quantity,
          UnitPrice: li.unitAmount,
          ItemRef: { value: '1', name: 'Services' },
        },
      }))

      const qbInvoice: any = {
        CustomerRef: { value: custResult.externalId },
        DocNumber: invoice.invoiceNumber,
        TxnDate: invoice.date.toISOString().split('T')[0],
        DueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
        PrivateNote: invoice.reference,
        Line: lines,
        CurrencyRef: { value: invoice.currencyCode || 'GBP' },
      }

      const result = await this.apiRequest('POST', `${base}/invoice?minorversion=65`, accessToken, qbInvoice)
      const created = result.Invoice
      return { success: true, externalId: String(created.Id), externalRef: created.DocNumber }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'QuickBooks invoice error' }
    }
  }

  // ── Bill (purchase from agency to Cube) ───────────────────────────────────
  async createBill(
    realmId: string,
    refreshToken: string,
    invoice: AccountingInvoice
  ): Promise<AccountingResult> {
    try {
      const accessToken = await this.refreshAndGetToken(refreshToken)
      const base = this.baseUrl(realmId)

      // Find or create vendor
      const query = encodeURIComponent(`SELECT * FROM Vendor WHERE DisplayName = '${invoice.contactName.replace(/'/g, "\\'")}'`)
      const searchRes = await this.apiRequest('GET', `${base}/query?query=${query}&minorversion=65`, accessToken)
      let vendor = searchRes.QueryResponse?.Vendor?.[0]

      if (!vendor) {
        const newVendor = await this.apiRequest('POST', `${base}/vendor?minorversion=65`, accessToken, {
          DisplayName: invoice.contactName,
          PrimaryEmailAddr: invoice.contactEmail ? { Address: invoice.contactEmail } : undefined,
        })
        vendor = newVendor.Vendor
      }

      const lines = invoice.lineItems.map((li, idx) => ({
        Id: String(idx + 1),
        Amount: li.quantity * li.unitAmount,
        DetailType: 'AccountBasedExpenseLineDetail',
        Description: li.description,
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: li.accountCode || process.env.QB_DEFAULT_EXPENSE_ACCOUNT || '63' },
        },
      }))

      const qbBill: any = {
        VendorRef: { value: String(vendor.Id) },
        DocNumber: invoice.invoiceNumber,
        TxnDate: invoice.date.toISOString().split('T')[0],
        DueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : undefined,
        PrivateNote: invoice.reference,
        Line: lines,
        CurrencyRef: { value: invoice.currencyCode || 'GBP' },
      }

      const result = await this.apiRequest('POST', `${base}/bill?minorversion=65`, accessToken, qbBill)
      const created = result.Bill
      return { success: true, externalId: String(created.Id), externalRef: created.DocNumber }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'QuickBooks bill error' }
    }
  }
}

let qbService: QuickBooksService | null = null
export function getQuickBooksService(): QuickBooksService {
  if (!qbService) qbService = new QuickBooksService()
  return qbService
}
