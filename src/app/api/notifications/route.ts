/**
 * GET  /api/notifications  – return notifications for the current user
 * POST /api/notifications  – create a notification (admin only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json([], { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { userId: null },                                          // broadcasts
        { userId: session.id ?? '__none__' },                     // personal
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { title, message, type = 'ADMIN', link, userId } = body

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 })
  }

  const notification = await prisma.notification.create({
    data: { title, message, type, link, userId: userId || null },
  })

  return NextResponse.json(notification, { status: 201 })
}
