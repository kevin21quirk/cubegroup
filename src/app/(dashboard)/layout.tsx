// import { auth } from '@clerk/nextjs/server'
// import { redirect } from 'next/navigation'
// import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORARY: Auth check disabled
  // const { userId } = await auth()
  // if (!userId) {
  //   redirect('/sign-in')
  // }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Temporarily removed sidebar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
