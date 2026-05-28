'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key) as string | null
  return v && v.trim() !== '' ? v.trim() : undefined
}

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  if (!name?.trim()) throw new Error('Company name is required')

  const firstUser = await prisma.user.findFirst()
  if (!firstUser) throw new Error('No users found in system')

  const emailDomainsRaw = str(formData, 'emailDomains')
  const emailDomains = emailDomainsRaw
    ? emailDomainsRaw.split(',').map(d => d.trim()).filter(Boolean)
    : []

  await prisma.company.create({
    data: {
      name: name.trim(),
      registrationNumber:  str(formData, 'registrationNumber'),
      vatNumber:           str(formData, 'vatNumber'),
      industry:            str(formData, 'industry'),
      companyType:         str(formData, 'companyType'),
      payrollFrequency:    str(formData, 'payrollFrequency') || 'Weekly',
      billingAddress:      str(formData, 'billingAddress'),
      billingCity:         str(formData, 'billingCity'),
      billingPostcode:     str(formData, 'billingPostcode'),
      billingCountry:      str(formData, 'billingCountry') || 'United Kingdom',
      paymentTerms:        parseInt(str(formData, 'paymentTerms') || '30', 10),
      // Agency
      agencyName:          str(formData, 'agencyName'),
      agencyBranch:        str(formData, 'agencyBranch'),
      agencyRef:           str(formData, 'agencyRef'),
      // CIS
      cisRegistered:       formData.get('cisRegistered') === 'true',
      uniqueTaxRef:        str(formData, 'uniqueTaxRef'),
      verificationNumber:  str(formData, 'verificationNumber'),
      // Email processing
      emailDomains,
      remoteFolder:        str(formData, 'remoteFolder'),
      isActive: true,
      createdById: firstUser.id,
      contacts: {
        create: {
          firstName: 'Primary',
          lastName:  'Contact',
          email:     str(formData, 'email') || `contact@${name.replace(/\s+/g, '').toLowerCase()}.com`,
          phone:     str(formData, 'phone'),
          isPrimary: true,
        },
      },
    },
  })

  revalidatePath('/dashboard/companies')
  redirect('/dashboard/companies')
}

export async function getCompanies() {
  return await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      industry: true,
      billingAddress: true,
      isActive: true,
      createdAt: true,
      contacts: {
        where: { isPrimary: true },
        take: 1,
        select: {
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          workers: true,
          payrollSubmissions: true,
        },
      },
    },
  })
}

export async function getCompany(id: string) {
  return await prisma.company.findUnique({
    where: { id },
    include: {
      workers: true,
      payrollSubmissions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
}

export async function updateCompany(id: string, formData: FormData) {
  const name = formData.get('name') as string

  await prisma.company.update({
    where: { id },
    data: {
      name,
      industry:            str(formData, 'industry'),
      billingAddress:      str(formData, 'billingAddress'),
      billingCity:         str(formData, 'billingCity'),
      billingPostcode:     str(formData, 'billingPostcode'),
      paymentTerms:        parseInt(str(formData, 'paymentTerms') || '30', 10),
      isActive:            formData.get('isActive') === 'true',
      accountingSystem:    str(formData, 'accountingSystem') || 'None',
    },
  })

  revalidatePath('/dashboard/companies')
  revalidatePath(`/dashboard/companies/${id}`)
  redirect(`/dashboard/companies/${id}/edit`)
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({
    where: { id },
  })

  revalidatePath('/dashboard/companies')
  redirect('/dashboard/companies')
}
