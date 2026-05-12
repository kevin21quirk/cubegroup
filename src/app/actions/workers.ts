'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createWorker(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const companyId = formData.get('companyId') as string
  const nationalInsurance = formData.get('nationalInsurance') as string

  if (!firstName || !lastName || !companyId) {
    throw new Error('First name, last name, and company are required')
  }

  await prisma.worker.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      companyId,
      nationalInsurance,
      isActive: true,
    },
  })

  revalidatePath('/dashboard/workers')
  redirect('/dashboard/workers')
}

export async function getWorkers() {
  return await prisma.worker.findMany({
    orderBy: { createdAt: 'desc' },
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
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const nationalInsurance = formData.get('nationalInsurance') as string
  const isActive = formData.get('isActive') === 'true'

  await prisma.worker.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      phone,
      nationalInsurance,
      isActive,
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
