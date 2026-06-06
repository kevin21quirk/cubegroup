'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getUmbrellaCompanies() {
  return prisma.umbrellaCompany.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { payrollEntries: true } } },
  })
}

export async function getUmbrellaCompany(id: string) {
  return prisma.umbrellaCompany.findUnique({
    where: { id },
    include: { _count: { select: { payrollEntries: true } } },
  })
}

export async function createUmbrellaCompany(formData: FormData) {
  const name         = formData.get('name') as string
  const contactEmail = formData.get('contactEmail') as string
  const contactPhone = formData.get('contactPhone') as string | null
  const address      = formData.get('address') as string | null
  const city         = formData.get('city') as string | null
  const postcode     = formData.get('postcode') as string | null
  const processingFee = parseFloat((formData.get('processingFee') as string) || '0')

  if (!name || !contactEmail) throw new Error('Name and contact email are required')

  const company = await prisma.umbrellaCompany.create({
    data: {
      name,
      contactEmail,
      contactPhone: contactPhone || undefined,
      address:      address      || undefined,
      city:         city         || undefined,
      postcode:     postcode     || undefined,
      processingFee,
      isActive: true,
    },
  })

  revalidatePath('/dashboard/umbrella-companies')
  redirect(`/dashboard/umbrella-companies/${company.id}`)
}

export async function updateUmbrellaCompany(id: string, formData: FormData) {
  const name         = formData.get('name') as string
  const contactEmail = formData.get('contactEmail') as string
  const contactPhone = formData.get('contactPhone') as string | null
  const address      = formData.get('address') as string | null
  const city         = formData.get('city') as string | null
  const postcode     = formData.get('postcode') as string | null
  const processingFee = parseFloat((formData.get('processingFee') as string) || '0')
  const isActive     = formData.get('isActive') === 'true'

  await prisma.umbrellaCompany.update({
    where: { id },
    data: {
      name,
      contactEmail,
      contactPhone: contactPhone || null,
      address:      address      || null,
      city:         city         || null,
      postcode:     postcode     || null,
      processingFee,
      isActive,
    },
  })

  revalidatePath('/dashboard/umbrella-companies')
  revalidatePath(`/dashboard/umbrella-companies/${id}`)
}

export async function deleteUmbrellaCompany(id: string) {
  await prisma.umbrellaCompany.delete({ where: { id } })
  revalidatePath('/dashboard/umbrella-companies')
  redirect('/dashboard/umbrella-companies')
}
