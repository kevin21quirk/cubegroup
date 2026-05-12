'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const billingAddress = formData.get('billingAddress') as string
  const industry = formData.get('industry') as string

  if (!name) {
    throw new Error('Company name is required')
  }

  // Get the first user as creator (temporary - should use auth)
  const firstUser = await prisma.user.findFirst()
  if (!firstUser) {
    throw new Error('No users found in system')
  }

  const company = await prisma.company.create({
    data: {
      name,
      industry,
      billingAddress,
      isActive: true,
      createdById: firstUser.id,
      contacts: email ? {
        create: {
          firstName: 'Primary',
          lastName: 'Contact',
          email,
          phone,
          isPrimary: true,
        },
      } : undefined,
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
  const industry = formData.get('industry') as string
  const billingAddress = formData.get('billingAddress') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.company.update({
    where: { id },
    data: {
      name,
      industry,
      billingAddress,
      isActive,
    },
  })

  revalidatePath('/dashboard/companies')
  revalidatePath(`/dashboard/companies/${id}`)
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({
    where: { id },
  })

  revalidatePath('/dashboard/companies')
  redirect('/dashboard/companies')
}
