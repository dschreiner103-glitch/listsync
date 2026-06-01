import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const pg = () => !!process.env.DATABASE_URL?.startsWith('postgres')

async function ensureNotifTable() {
  try {
    if (pg()) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS community_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          from_name TEXT NOT NULL DEFAULT '',
          channel TEXT NOT NULL DEFAULT '',
          message_id INTEGER NOT NULL DEFAULT 0,
          read INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } else {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS community_notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          from_name TEXT NOT NULL DEFAULT '',
          channel TEXT NOT NULL DEFAULT '',
          message_id INTEGER NOT NULL DEFAULT 0,
          read INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `)
    }
  } catch { /* exists */ }
}

// GET — unread count per channel
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })
  await ensureMigrated()
  await ensureNotifTable()
  const userId = Number(session.user.id)
  try {
    const rows = pg()
      ? await prisma.$queryRawUnsafe(`SELECT channel, COUNT(*) as cnt FROM community_notifications WHERE user_id = $1 AND read = 0 GROUP BY channel`, userId)
      : await prisma.$queryRawUnsafe(`SELECT channel, COUNT(*) as cnt FROM community_notifications WHERE user_id = ? AND read = 0 GROUP BY channel`, userId)
    const result = {}
    for (const r of rows) result[r.channel] = Number(r.cnt)
    return NextResponse.json(result)
  } catch { return NextResponse.json({}) }
}

// POST — mark channel as read
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 })
  await ensureMigrated()
  await ensureNotifTable()
  const { channel } = await req.json()
  const userId = Number(session.user.id)
  try {
    pg()
      ? await prisma.$executeRawUnsafe(`UPDATE community_notifications SET read = 1 WHERE user_id = $1 AND channel = $2`, userId, channel)
      : await prisma.$executeRawUnsafe(`UPDATE community_notifications SET read = 1 WHERE user_id = ? AND channel = ?`, userId, channel)
  } catch { /* ignore */ }
  return NextResponse.json({ ok: true })
}
