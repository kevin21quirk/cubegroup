import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ notifId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { notifId } = await params

  await prisma.notification.updateMany({
    where: {
      id: notifId,
      OR: [
        { userId: null },
        { userId: session.id ?? '__none__' },
      ],
    },
    data: { isRead: true },
  })

  return NextResponse.json({ success: true })
}
