import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Mail,
  Receipt,
  CreditCard,
  Settings,
  BarChart3,
  GitBranch,
  UserCog,
  LogOut,
} from 'lucide-react'
import { handleLogout } from '@/app/actions/auth'
import { getSession } from '@/lib/auth'
import { SidebarClient } from './sidebar-client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch },
  { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { name: 'Workers', href: '/dashboard/workers', icon: Users },
  { name: 'Payroll Submissions', href: '/dashboard/payroll', icon: FileText },
  { name: 'Email Inbox', href: '/dashboard/emails', icon: Mail },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'User Management', href: '/dashboard/users', icon: UserCog, adminOnly: true },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export async function Sidebar() {
  const user = await getSession()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  
  // Filter navigation based on role
  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isSuperAdmin
  )

  return <SidebarClient navigation={filteredNavigation} />
}
