import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  await prisma.notification.updateMany({
    where: {
      isRead: false,
      OR: [
        { userId: null },
        { userId: session.id ?? '__none__' },
      ],
    },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
