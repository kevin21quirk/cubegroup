'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createUser(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'SUPER_ADMIN' | 'CUBE_ADMIN' | 'PAYROLL_OPERATOR' | 'FINANCE_USER' | 'READ_ONLY'
  const companyId = formData.get('companyId') as string

  if (!firstName || !lastName || !email || !password || !role) {
    throw new Error('All fields are required')
  }

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password, // In production, hash this password!
      role,
      companyId: companyId || null,
    },
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export async function getUsers() {
  return await prisma.user.findMany({
    include: {
      company: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
    },
  })
}

export async function updateUser(id: string, formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as 'SUPER_ADMIN' | 'CUBE_ADMIN' | 'PAYROLL_OPERATOR' | 'FINANCE_USER' | 'READ_ONLY'
  const companyId = formData.get('companyId') as string
  const password = formData.get('password') as string

  const updateData: any = {
    firstName,
    lastName,
    email,
    role,
    companyId: companyId || null,
  }

  // Only update password if provided
  if (password) {
    updateData.password = password // In production, hash this password!
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  })

  revalidatePath('/dashboard/users')
}
