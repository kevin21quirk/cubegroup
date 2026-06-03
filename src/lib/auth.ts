import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './prisma'

export type UserRole = 'SUPER_ADMIN' | 'STAFF'

export interface User {
  email: string
  role: UserRole
  companyId?: string
  name: string
  id?: string
  assignedCompanyIds: string[]
}

// Super admin credentials (hardcoded)
const SUPER_ADMIN = {
  email: 'kevin@aibridgesolutions.co.uk',
  password: 'a15Dz6fl!',
  name: 'Kevin (Super Admin)',
  role: 'SUPER_ADMIN' as const,
}

export async function login(email: string, password: string, companyId?: string): Promise<User | null> {
  // Check super admin (hardcoded)
  if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
    const user: User = {
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
      companyId: companyId || undefined,
      assignedCompanyIds: [],  // super admin sees all — empty means no filter
    }
    await setSession(user)
    return user
  }

  // Check database users
  const dbUser = await prisma.user.findUnique({
    where: { email },
    include: { staffCompanies: { select: { id: true } } },
  })

  if (dbUser && dbUser.password === password && dbUser.isActive) {
    const assignedCompanyIds = dbUser.staffCompanies.map(c => c.id)
    const userData: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || dbUser.email,
      role: dbUser.role as UserRole,
      companyId: companyId || dbUser.companyId || undefined,
      assignedCompanyIds,
    }
    await setSession(userData)
    return userData
  }

  return null
}

export async function setSession(user: User) {
  const cookieStore = await cookies()
  cookieStore.set('user', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const userCookie = cookieStore.get('user')
  
  if (!userCookie) {
    return null
  }

  try {
    return JSON.parse(userCookie.value) as User
  } catch {
    return null
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('user')
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireSuperAdmin() {
  const user = await getSession()
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }
  return user
}
