'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

export async function createUser(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'SUPER_ADMIN' | 'STAFF'
  const companyId = formData.get('companyId') as string

  if (!firstName || !lastName || !email || !password || !role) {
    throw new Error('All fields are required')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
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
      staffCompanies: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
      staffCompanies: { select: { id: true, name: true } },
    },
  })
}

export async function setUserCompanies(userId: string, companyIds: string[]) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      staffCompanies: {
        set: companyIds.map(id => ({ id })),
      },
    },
  })
  revalidatePath('/dashboard/users')
}

export async function updateUser(id: string, formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as 'SUPER_ADMIN' | 'STAFF'
  const companyId = formData.get('companyId') as string
  const password = formData.get('password') as string
  const companyIds = formData.getAll('companyIds') as string[]

  const updateData: any = {
    firstName,
    lastName,
    email,
    role,
    companyId: companyId || null,
    staffCompanies: {
      set: companyIds.filter(Boolean).map(cid => ({ id: cid })),
    },
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 12)
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
