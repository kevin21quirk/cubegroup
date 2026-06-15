'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, Users, FileText, Mail, Receipt, CreditCard, Settings, BarChart3, GitBranch, LogOut, UserCog, Umbrella } from 'lucide-react'
import { handleLogout } from '@/app/actions/auth'
import type { UserRole } from '@/lib/auth'

export function SidebarClient({ role }: { role: UserRole }) {
  const isSuperAdmin = role === 'SUPER_ADMIN'
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
            <Link
              href="/dashboard"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <LayoutDashboard
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Dashboard
            </Link>
            <Link
              href="/dashboard/workflow"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/workflow'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <GitBranch
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/workflow'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Workflow
            </Link>
            <Link
              href="/dashboard/companies"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/companies'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Building2
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/companies'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Companies
            </Link>
            <Link
              href="/dashboard/umbrella-companies"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/umbrella-companies' || pathname.startsWith('/dashboard/umbrella-companies/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Umbrella
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/umbrella-companies' || pathname.startsWith('/dashboard/umbrella-companies/')
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Payroll Companies
            </Link>
            <Link
              href="/dashboard/workers"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/workers'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Users
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/workers'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Workers
            </Link>
            <Link
              href="/dashboard/payroll"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/payroll'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <FileText
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/payroll'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Payroll Submissions
            </Link>
            <Link
              href="/dashboard/emails"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/emails'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Mail
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/emails'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Email Inbox
            </Link>
            <Link
              href="/dashboard/invoices"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/invoices'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <Receipt
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/invoices'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Invoices
            </Link>
            <Link
              href="/dashboard/payments"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/payments'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <CreditCard
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/payments'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Payments
            </Link>
            <Link
              href="/dashboard/reports"
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                pathname === '/dashboard/reports'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <BarChart3
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  pathname === '/dashboard/reports'
                    ? 'text-primary-foreground'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              />
              Reports
            </Link>
            {isSuperAdmin && (
              <Link
                href="/dashboard/users"
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === '/dashboard/users' || pathname.startsWith('/dashboard/users/')
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <UserCog
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    pathname === '/dashboard/users' || pathname.startsWith('/dashboard/users/')
                      ? 'text-primary-foreground'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  )}
                />
                Users
              </Link>
            )}
            {isSuperAdmin && (
              <Link
                href="/dashboard/settings"
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === '/dashboard/settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Settings
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    pathname === '/dashboard/settings'
                      ? 'text-primary-foreground'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  )}
                />
                Settings
              </Link>
            )}
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
