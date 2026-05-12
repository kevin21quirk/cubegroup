'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCompany(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  if (!name || !email) {
    throw new Error('Name and email are required')
  }

  await prisma.company.create({
    data: {
      name,
      email,
      phone,
      address,
      isActive: true,
    },
  })

  revalidatePath('/dashboard/companies')
  redirect('/dashboard/companies')
}

export async function getCompanies() {
  return await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
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
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.company.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      address,
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
