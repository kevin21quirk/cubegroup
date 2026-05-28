/**
 * AccountingService – unified interface.
 * Routes to Xero or QuickBooks based on the company's accountingSystem setting.
 */
import { prisma } from '@/lib/prisma'
import { getXeroService } from './XeroService'
import { getQuickBooksService } from './QuickBooksService'
import type { AccountingInvoice, AccountingContact, AccountingResult } from './XeroService'
import type { NormalizedPayrollData } from '@/types/payroll'

export type { AccountingInvoice, AccountingContact, AccountingResult }

export interface PayrollExportOptions {
  companyId:            string
  payrollSubmissionId?: string
  entries:              NormalizedPayrollData[]
  companyName:          string
  payrollWeek:          string
  invoiceNumber?:       string
  dueDate?:             Date
}

export class AccountingService {

  // ── Push a full payroll submission to accounting ─────────────────────────
  async exportPayroll(opts: PayrollExportOptions): Promise<AccountingResult> {
    const company = await prisma.company.findUnique({ where: { id: opts.companyId } })
    if (!company) return { success: false, error: 'Company not found' }

    if (company.accountingSystem === 'None' || !company.accountingSystem) {
      return { success: true, externalRef: 'No accounting system configured' }
    }

    const lineItems = opts.entries.map(e => ({
      description: `${e.workerName || `${e.firstName} ${e.lastName}`} – ${e.hoursWorked}h @ £${e.hourlyRate}/hr (${opts.payrollWeek})`,
      quantity: e.hoursWorked,
      unitAmount: e.hourlyRate,
    }))

    const invoice: AccountingInvoice = {
      contactName:    opts.companyName,
      invoiceNumber:  opts.invoiceNumber,
      reference:      `Payroll – ${opts.payrollWeek}`,
      date:           new Date(),
      dueDate:        opts.dueDate,
      lineItems,
    }

    let result: AccountingResult
    if (company.accountingSystem === 'Xero') {
      if (!company.xeroTenantId || !company.xeroRefreshToken) {
        return { success: false, error: 'Xero not connected for this company' }
      }
      result = await getXeroService().createInvoice(company.xeroTenantId, company.xeroRefreshToken, invoice)
    } else if (company.accountingSystem === 'QuickBooks') {
      if (!company.quickbooksRealmId || !company.quickbooksRefreshToken) {
        return { success: false, error: 'QuickBooks not connected for this company' }
      }
      result = await getQuickBooksService().createInvoice(company.quickbooksRealmId, company.quickbooksRefreshToken, invoice)
    } else {
      return { success: true, externalRef: `${company.accountingSystem} – manual export` }
    }

    // Record the export
    await prisma.accountingExport.create({
      data: {
        companyId:          opts.companyId,
        payrollSubmissionId: opts.payrollSubmissionId,
        accountingSystem:   company.accountingSystem,
        exportType:         'Invoice',
        externalId:         result.externalId,
        externalRef:        result.externalRef,
        status:             result.success ? 'SUCCESS' : 'FAILED',
        exportedAt:         result.success ? new Date() : undefined,
        errorMessage:       result.error,
        metadata:           { companyName: opts.companyName, payrollWeek: opts.payrollWeek },
      },
    })

    return result
  }

  // ── Sync a contact (worker or agency) ────────────────────────────────────
  async syncContact(companyId: string, contact: AccountingContact): Promise<AccountingResult> {
    const company = await prisma.company.findUnique({ where: { id: companyId } })
    if (!company) return { success: false, error: 'Company not found' }

    if (company.accountingSystem === 'Xero' && company.xeroTenantId && company.xeroRefreshToken) {
      return getXeroService().createOrUpdateContact(company.xeroTenantId, company.xeroRefreshToken, contact)
    }
    if (company.accountingSystem === 'QuickBooks' && company.quickbooksRealmId && company.quickbooksRefreshToken) {
      return getQuickBooksService().createOrUpdateCustomer(company.quickbooksRealmId, company.quickbooksRefreshToken, contact)
    }
    return { success: true, externalRef: 'No accounting system configured' }
  }

  // ── Get recent exports for a company ─────────────────────────────────────
  async getExports(companyId: string, limit = 20) {
    return prisma.accountingExport.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

let accountingService: AccountingService | null = null
export function getAccountingService(): AccountingService {
  if (!accountingService) accountingService = new AccountingService()
  return accountingService
}
