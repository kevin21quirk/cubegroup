'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key) as string | null
  return v && v.trim() !== '' ? v.trim() : undefined
}
function num(fd: FormData, key: string): number | undefined {
  const v = fd.get(key) as string | null
  if (!v || v.trim() === '') return undefined
  const n = parseFloat(v)
  return isNaN(n) ? undefined : n
}
function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'true' || fd.get(key) === 'on' || fd.get(key) === '1'
}
function date(fd: FormData, key: string): Date | undefined {
  const v = fd.get(key) as string | null
  if (!v || v.trim() === '') return undefined
  const d = new Date(v)
  return isNaN(d.getTime()) ? undefined : d
}

export async function createWorker(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const companyId = formData.get('companyId') as string

  if (!firstName || !lastName || !companyId) {
    throw new Error('First name, last name, and company are required')
  }

  await prisma.worker.create({
    data: {
      companyId,
      // Personal
      title:                    str(formData, 'title'),
      firstName,
      middleNames:              str(formData, 'middleNames'),
      lastName,
      gender:                   str(formData, 'gender'),
      dateOfBirth:              date(formData, 'dateOfBirth'),
      nationality:              str(formData, 'nationality'),
      // Contact
      mobile:                   str(formData, 'mobile'),
      phone:                    str(formData, 'phone'),
      email:                    str(formData, 'email'),
      // Address
      addressLine1:             str(formData, 'addressLine1'),
      addressLine2:             str(formData, 'addressLine2'),
      addressLine3:             str(formData, 'addressLine3'),
      town:                     str(formData, 'town'),
      county:                   str(formData, 'county'),
      livingCountry:            str(formData, 'livingCountry') || 'United Kingdom',
      postCode:                 str(formData, 'postCode'),
      // Banking
      nameOnBankAccount:        str(formData, 'nameOnBankAccount'),
      bankName:                 str(formData, 'bankName'),
      bankAccountNumber:        str(formData, 'bankAccountNumber'),
      bankSortCode:             str(formData, 'bankSortCode'),
      buildingSocietyNo:        str(formData, 'buildingSocietyNo'),
      nonUkBank:                bool(formData, 'nonUkBank'),
      // Third party bank
      thirdPartyBankAccount:    bool(formData, 'thirdPartyBankAccount'),
      thirdPartyAccountName:    str(formData, 'thirdPartyAccountName'),
      thirdPartyAddress1:       str(formData, 'thirdPartyAddress1'),
      thirdPartyTown:           str(formData, 'thirdPartyTown'),
      thirdPartyPostcode:       str(formData, 'thirdPartyPostcode'),
      thirdPartyCountry:        str(formData, 'thirdPartyCountry'),
      thirdPartyRelationship:   str(formData, 'thirdPartyRelationship'),
      thirdPartyContactNo:      str(formData, 'thirdPartyContactNo'),
      thirdPartyDob:            date(formData, 'thirdPartyDob'),
      // Tax / starter
      nationalInsurance:        str(formData, 'nationalInsurance'),
      starterDeclaration:       str(formData, 'starterDeclaration'),
      p45GrossForTax:           num(formData, 'p45GrossForTax'),
      p45TaxDeducted:           num(formData, 'p45TaxDeducted'),
      startDate:                date(formData, 'startDate'),
      payFrequency:             str(formData, 'payFrequency'),
      niCategory:               str(formData, 'niCategory'),
      taxCode:                  str(formData, 'taxCode'),
      taxBasis:                 str(formData, 'taxBasis'),
      // Commercial
      product:                  str(formData, 'product'),
      agency:                   str(formData, 'agency'),
      branch:                   str(formData, 'branch'),
      agencyRef:                str(formData, 'agencyRef'),
      jobDescription:           str(formData, 'jobDescription'),
      holidayPayRule:           str(formData, 'holidayPayRule'),
      applyHolidayEmploymentCosts: bool(formData, 'applyHolidayEmploymentCosts'),
      derogationContract:       bool(formData, 'derogationContract'),
      derogationSpread:         bool(formData, 'derogationSpread'),
      serviceUsed:              str(formData, 'serviceUsed'),
      payeAmount:               num(formData, 'payeAmount'),
      paymentTerms:             str(formData, 'paymentTerms'),
      paymentMethod:            str(formData, 'paymentMethod'),
      loanPlan:                 str(formData, 'loanPlan'),
      // Compliance
      pensionApplicable:        bool(formData, 'pensionApplicable'),
      apprenticeshipLevy:       bool(formData, 'apprenticeshipLevy'),
      gdpr:                     bool(formData, 'gdpr'),
      minimumMarginCharge:      num(formData, 'minimumMarginCharge'),
      agencyMarginRule:         str(formData, 'agencyMarginRule'),
      // CIS
      utrNumber:                str(formData, 'utrNumber'),
      cisStatus:                str(formData, 'cisStatus'),
      tradingName:              str(formData, 'tradingName'),
      contractorType:           str(formData, 'contractorType'),
      // Internal
      employeeNumber:           str(formData, 'employeeNumber'),
      department:               str(formData, 'department'),
      isActive: true,
    },
  })

  revalidatePath('/dashboard/workers')
  redirect('/dashboard/workers')
}

export async function getWorkers() {
  const session = await getSession()
  const isStaff = session?.role === 'STAFF'
  const assignedIds = session?.assignedCompanyIds ?? []

  return await prisma.worker.findMany({
    orderBy: { createdAt: 'desc' },
    where: isStaff && assignedIds.length > 0 ? { companyId: { in: assignedIds } } : undefined,
    include: {
      company: true,
      _count: {
        select: {
          payrollEntries: true,
        },
      },
    },
  })
}

export async function getWorker(id: string) {
  return await prisma.worker.findUnique({
    where: { id },
    include: {
      company: true,
      payrollEntries: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          payrollSubmission: true,
        },
      },
    },
  })
}

export async function updateWorker(id: string, formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  if (!firstName || !lastName) throw new Error('First name and last name are required')

  await prisma.worker.update({
    where: { id },
    data: {
      title:                    str(formData, 'title'),
      firstName,
      middleNames:              str(formData, 'middleNames'),
      lastName,
      gender:                   str(formData, 'gender'),
      dateOfBirth:              date(formData, 'dateOfBirth'),
      nationality:              str(formData, 'nationality'),
      mobile:                   str(formData, 'mobile'),
      phone:                    str(formData, 'phone'),
      email:                    str(formData, 'email'),
      addressLine1:             str(formData, 'addressLine1'),
      addressLine2:             str(formData, 'addressLine2'),
      addressLine3:             str(formData, 'addressLine3'),
      town:                     str(formData, 'town'),
      county:                   str(formData, 'county'),
      livingCountry:            str(formData, 'livingCountry') || 'United Kingdom',
      postCode:                 str(formData, 'postCode'),
      nameOnBankAccount:        str(formData, 'nameOnBankAccount'),
      bankName:                 str(formData, 'bankName'),
      bankAccountNumber:        str(formData, 'bankAccountNumber'),
      bankSortCode:             str(formData, 'bankSortCode'),
      buildingSocietyNo:        str(formData, 'buildingSocietyNo'),
      nonUkBank:                bool(formData, 'nonUkBank'),
      thirdPartyBankAccount:    bool(formData, 'thirdPartyBankAccount'),
      thirdPartyAccountName:    str(formData, 'thirdPartyAccountName'),
      thirdPartyAddress1:       str(formData, 'thirdPartyAddress1'),
      thirdPartyTown:           str(formData, 'thirdPartyTown'),
      thirdPartyPostcode:       str(formData, 'thirdPartyPostcode'),
      thirdPartyCountry:        str(formData, 'thirdPartyCountry'),
      thirdPartyRelationship:   str(formData, 'thirdPartyRelationship'),
      thirdPartyContactNo:      str(formData, 'thirdPartyContactNo'),
      thirdPartyDob:            date(formData, 'thirdPartyDob'),
      nationalInsurance:        str(formData, 'nationalInsurance'),
      starterDeclaration:       str(formData, 'starterDeclaration'),
      p45GrossForTax:           num(formData, 'p45GrossForTax'),
      p45TaxDeducted:           num(formData, 'p45TaxDeducted'),
      startDate:                date(formData, 'startDate'),
      payFrequency:             str(formData, 'payFrequency'),
      niCategory:               str(formData, 'niCategory'),
      taxCode:                  str(formData, 'taxCode'),
      taxBasis:                 str(formData, 'taxBasis'),
      product:                  str(formData, 'product'),
      agency:                   str(formData, 'agency'),
      branch:                   str(formData, 'branch'),
      agencyRef:                str(formData, 'agencyRef'),
      jobDescription:           str(formData, 'jobDescription'),
      holidayPayRule:           str(formData, 'holidayPayRule'),
      applyHolidayEmploymentCosts: bool(formData, 'applyHolidayEmploymentCosts'),
      derogationContract:       bool(formData, 'derogationContract'),
      derogationSpread:         bool(formData, 'derogationSpread'),
      serviceUsed:              str(formData, 'serviceUsed'),
      payeAmount:               num(formData, 'payeAmount'),
      paymentTerms:             str(formData, 'paymentTerms'),
      paymentMethod:            str(formData, 'paymentMethod'),
      loanPlan:                 str(formData, 'loanPlan'),
      pensionApplicable:        bool(formData, 'pensionApplicable'),
      apprenticeshipLevy:       bool(formData, 'apprenticeshipLevy'),
      gdpr:                     bool(formData, 'gdpr'),
      minimumMarginCharge:      num(formData, 'minimumMarginCharge'),
      agencyMarginRule:         str(formData, 'agencyMarginRule'),
      utrNumber:                str(formData, 'utrNumber'),
      cisStatus:                str(formData, 'cisStatus'),
      tradingName:              str(formData, 'tradingName'),
      contractorType:           str(formData, 'contractorType'),
      employeeNumber:           str(formData, 'employeeNumber'),
      department:               str(formData, 'department'),
      isActive:                 formData.get('isActive') !== 'false',
    },
  })

  revalidatePath('/dashboard/workers')
  revalidatePath(`/dashboard/workers/${id}`)
}

export async function deleteWorker(id: string) {
  await prisma.worker.delete({
    where: { id },
  })

  revalidatePath('/dashboard/workers')
  redirect('/dashboard/workers')
}
