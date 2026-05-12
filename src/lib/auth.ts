import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type UserRole = 'SUPER_ADMIN' | 'CUBE_ADMIN' | 'PAYROLL_OPERATOR' | 'FINANCE_USER' | 'READ_ONLY'

export interface User {
  email: string
  role: UserRole
  companyId?: string
  name: string
}

// Super admin credentials
const SUPER_ADMIN = {
  email: 'kevin@aibridgesolutions.co.uk',
  password: 'a15Dz6fl!',
  name: 'Kevin (Super Admin)',
  role: 'SUPER_ADMIN' as const,
}

// Simple user store (in production, this would be in database)
const USERS: Record<string, { password: string; name: string; role: UserRole; companyId?: string }> = {
  // Add more users here as needed
}

export async function login(email: string, password: string, companyId?: string): Promise<User | null> {
  // Check super admin
  if (email === SUPER_ADMIN.email && password === SUPER_ADMIN.password) {
    const user: User = {
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.name,
      role: SUPER_ADMIN.role,
    }
    await setSession(user)
    return user
  }

  // Check regular users
  const user = USERS[email]
  if (user && user.password === password) {
    const userData: User = {
      email,
      name: user.name,
      role: user.role,
      companyId: companyId || user.companyId,
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
