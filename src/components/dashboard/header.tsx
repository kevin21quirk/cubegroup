"use client"

// import { UserButton } from '@clerk/nextjs'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-1 items-center">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search companies, workers, invoices..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* TEMPORARY: UserButton disabled until Clerk is configured */}
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          {/* <UserButton afterSignOutUrl="/sign-in" /> */}
        </div>
      </div>
    </header>
  )
}
