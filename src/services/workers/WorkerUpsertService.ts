/**
 * WorkerUpsertService
 * Creates or updates a Worker record from AI-extracted contractor data.
 * Match priority: NI Number → email → (first + last name + companyId)
 */
import { prisma } from '@/lib/prisma'
import { WorkerExtractionData } from '../ai/AIExtractionService'
import { NormalizedPayrollData } from '@/types/payroll'

export interface UpsertResult {
  worker: { id: string; firstName: string; lastName: string; isNew: boolean }
  action: 'created' | 'updated' | 'unchanged'
}

export class WorkerUpsertService {

  async upsertFromExtraction(
    companyId: string,
    workerData: WorkerExtractionData,
    payrollEntry?: NormalizedPayrollData
  ): Promise<UpsertResult> {
    const ni   = workerData.nationalInsurance?.replace(/\s/g, '').toUpperCase() || null
    const email = workerData.email?.toLowerCase().trim() || null
    const firstName = workerData.firstName?.trim() || payrollEntry?.firstName?.trim() || ''
    const lastName  = workerData.lastName?.trim()  || payrollEntry?.lastName?.trim()  || ''

    // ── 1. Try to find existing worker ──────────────────────────────────────
    let existing = null

    if (ni) {
      existing = await prisma.worker.findFirst({
        where: { companyId, nationalInsurance: { equals: ni, mode: 'insensitive' } },
      })
    }
    if (!existing && email) {
      existing = await prisma.worker.findFirst({
        where: { companyId, email: { equals: email, mode: 'insensitive' } },
      })
    }
    if (!existing && firstName && lastName) {
      existing = await prisma.worker.findFirst({
        where: {
          companyId,
          firstName: { equals: firstName, mode: 'insensitive' },
          lastName:  { equals: lastName,  mode: 'insensitive' },
        },
      })
    }

    const data = this.buildWorkerData(companyId, workerData, payrollEntry)

    if (existing) {
      // ── 2a. Update – only overwrite fields where we have a new non-empty value
      const updates = this.diffUpdates(existing, data)
      if (Object.keys(updates).length === 0) {
        return { worker: { id: existing.id, firstName: existing.firstName, lastName: existing.lastName, isNew: false }, action: 'unchanged' }
      }
      await prisma.worker.update({ where: { id: existing.id }, data: updates })
      return { worker: { id: existing.id, firstName: existing.firstName, lastName: existing.lastName, isNew: false }, action: 'updated' }
    } else {
      // ── 2b. Create new worker
      if (!firstName || !lastName) {
        // Cannot create without at least a name — skip
        return { worker: { id: '', firstName: firstName || 'Unknown', lastName: lastName || 'Worker', isNew: false }, action: 'unchanged' }
      }
      const created = await prisma.worker.create({ data })
      return { worker: { id: created.id, firstName: created.firstName, lastName: created.lastName, isNew: true }, action: 'created' }
    }
  }

  // Upsert from a payroll entry alone (timesheet without full contractor registration)
  async upsertFromPayrollEntry(
    companyId: string,
    entry: NormalizedPayrollData
  ): Promise<UpsertResult> {
    const workerData: WorkerExtractionData = {
      firstName:         entry.firstName,
      lastName:          entry.lastName,
      nationalInsurance: entry.niNumber,
      startDate:         entry.startDate,
      jobDescription:    entry.jobTitle,
    }
    return this.upsertFromExtraction(companyId, workerData, entry)
  }

  private buildWorkerData(companyId: string, w: WorkerExtractionData, pe?: NormalizedPayrollData) {
    const toDate = (s?: string | null) => {
      if (!s) return undefined
      const d = new Date(s)
      return isNaN(d.getTime()) ? undefined : d
    }
    return {
      companyId,
      firstName:             w.firstName  || pe?.firstName  || '',
      lastName:              w.lastName   || pe?.lastName   || '',
      title:                 w.title                         || undefined,
      middleNames:           w.middleNames                   || undefined,
      gender:                w.gender                        || undefined,
      dateOfBirth:           toDate(w.dateOfBirth),
      nationality:           w.nationality                   || undefined,
      nationalInsurance:     w.nationalInsurance?.replace(/\s/g, '').toUpperCase() || undefined,
      mobile:                w.mobile                        || undefined,
      phone:                 w.phone                         || undefined,
      email:                 w.email?.toLowerCase().trim()  || undefined,
      addressLine1:          w.addressLine1                  || undefined,
      addressLine2:          w.addressLine2                  || undefined,
      addressLine3:          w.addressLine3                  || undefined,
      town:                  w.town                          || undefined,
      county:                w.county                        || undefined,
      livingCountry:         w.livingCountry                 || 'United Kingdom',
      postCode:              w.postCode                      || undefined,
      nameOnBankAccount:     w.nameOnBankAccount             || undefined,
      bankName:              w.bankName                      || undefined,
      bankAccountNumber:     w.bankAccountNumber             || undefined,
      bankSortCode:          w.bankSortCode                  || undefined,
      niCategory:            w.niCategory                   || undefined,
      taxCode:               w.taxCode                       || undefined,
      taxBasis:              w.taxBasis                      || undefined,
      starterDeclaration:    w.starterDeclaration            || undefined,
      p45GrossForTax:        w.p45GrossForTax                || undefined,
      p45TaxDeducted:        w.p45TaxDeducted                || undefined,
      startDate:             toDate(w.startDate || pe?.startDate),
      payFrequency:          w.payFrequency                  || undefined,
      product:               w.product                       || pe?.umbrellaCompany || undefined,
      agency:                w.agency                        || pe?.companyName     || undefined,
      branch:                w.branch                        || undefined,
      agencyRef:             w.agencyRef                     || undefined,
      jobDescription:        w.jobDescription || pe?.jobTitle || undefined,
      utrNumber:             w.utrNumber                     || undefined,
      cisStatus:             w.cisStatus                     || undefined,
      tradingName:           w.tradingName                   || undefined,
      contractorType:        w.contractorType                || undefined,
      pensionApplicable:     w.pensionApplicable             ?? false,
      apprenticeshipLevy:    w.apprenticeshipLevy            ?? false,
      isActive: true,
    }
  }

  // Only update fields that are non-empty in the new data and different from existing
  private diffUpdates(existing: any, newData: any): Record<string, any> {
    const skip = new Set(['companyId', 'isActive'])
    const updates: Record<string, any> = {}
    for (const [key, val] of Object.entries(newData)) {
      if (skip.has(key)) continue
      if (val === undefined || val === null || val === '') continue
      if (val === existing[key]) continue
      // Don't overwrite a populated field with an empty/null from AI
      if (existing[key] && !val) continue
      updates[key] = val
    }
    return updates
  }
}

let workerUpsertService: WorkerUpsertService | null = null
export function getWorkerUpsertService(): WorkerUpsertService {
  if (!workerUpsertService) workerUpsertService = new WorkerUpsertService()
  return workerUpsertService
}
