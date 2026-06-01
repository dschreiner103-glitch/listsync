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
    // Check if an owner already exists
    const owners = isPostgres()
      ? await prisma.$queryRawUnsafe(`SELECT user_id FROM community_profiles WHERE role = 'owner' LIMIT 1`)
      : await prisma.$queryRawUnsafe(`SELECT user_id FROM community_profiles WHERE role = 'owner' LIMIT 1`)

    if (owners.length > 0) {
      return NextResponse.json({ error: 'Ein Owner existiert bereits.' }, { status: 403 })
    }

    // Set this user as owner
    if (isPostgres()) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO community_profiles (user_id, role, xp, last_seen)
        VALUES ($1, 'owner', 0, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET role = 'owner'
      `, userId)
    } else {
      await prisma.$executeRawUnsafe(`
        INSERT OR REPLACE INTO community_profiles (user_id, role, xp, last_seen)
        VALUES (?, 'owner', COALESCE((SELECT xp FROM community_profiles WHERE user_id = ?), 0), CURRENT_TIMESTAMP)
      `, userId, userId)
    }

    return NextResponse.json({ ok: true, message: 'Du bist jetzt Owner! 👑' })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
