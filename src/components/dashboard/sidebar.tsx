"use client"

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-gray-200 dark:border-gray-800">
          <Image
            src="/logo.png"
            alt="Cube Group"
            width={180}
            height={60}
            className="h-10 w-auto"
            priority
          />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 flex flex-col">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
            <form action={handleLogout}>
              <button
                type="submit"
                className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                Logout
              </button>
            </form>
          </div>
        </nav>
      </div>
    </div>
  )
}
