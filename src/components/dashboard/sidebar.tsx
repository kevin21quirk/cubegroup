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
} from 'lucide-react'
import { SidebarClient } from './sidebar-client'

const allNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflow', href: '/dashboard/workflow', icon: GitBranch },
  { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
  { name: 'Workers', href: '/dashboard/workers', icon: Users },
  { name: 'Payroll Submissions', href: '/dashboard/payroll', icon: FileText },
  { name: 'Email Inbox', href: '/dashboard/emails', icon: Mail },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'User Management', href: '/dashboard/users', icon: UserCog },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  // Show all navigation for now - will add role filtering later
  const navigation = allNavigation

  return <SidebarClient navigation={navigation} />
}
