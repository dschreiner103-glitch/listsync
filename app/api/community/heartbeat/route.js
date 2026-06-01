import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith('postgres')

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMigrated()
  const userId = Number(session.user.id)

  try {
    if (isPostgres()) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO community_profiles (user_id, last_seen)
        VALUES ($1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP
      `, userId)
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT OR REPLACE INTO community_profiles (user_id, role, xp, last_seen)
        VALUES (?, COALESCE((SELECT role FROM community_profiles WHERE user_id = ?), 'member'),
                   COALESCE((SELECT xp   FROM community_profiles WHERE user_id = ?), 0),
                   CURRENT_TIMESTAMP)
      `, userId, userId, userId)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false })
  }
}
