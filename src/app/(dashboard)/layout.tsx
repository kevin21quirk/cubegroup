import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { GmailTokenBanner } from '@/components/dashboard/GmailTokenBanner'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Check Gmail token age for expiry warning
  let gmailTokenDaysOld = 0
  let gmailConnectedEmail: string | null = null
  try {
    const [refreshedAt, emailRecord] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_TOKEN_REFRESHED_AT' } }),
      prisma.systemConfig.findUnique({ where: { key: 'GOOGLE_CONNECTED_EMAIL' } }),
    ])
    if (refreshedAt?.value) {
      const ms = Date.now() - new Date(refreshedAt.value).getTime()
      gmailTokenDaysOld = Math.floor(ms / (1000 * 60 * 60 * 24))
    }
    gmailConnectedEmail = emailRecord?.value ?? null
  } catch { /* non-fatal */ }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <GmailTokenBanner daysOld={gmailTokenDaysOld} connectedEmail={gmailConnectedEmail} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
