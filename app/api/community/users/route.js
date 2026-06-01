import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith('postgres')
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMigrated()

  try {
    // Get all users with their profiles
    let users
    if (isPostgres()) {
      users = await prisma.$queryRawUnsafe(`
        SELECT u.id, u.name, u.email,
               COALESCE(cp.role, 'member') as role,
               COALESCE(cp.xp, 0) as xp,
               cp.last_seen
        FROM "User" u
        LEFT JOIN community_profiles cp ON cp.user_id = u.id
        ORDER BY COALESCE(cp.xp, 0) DESC
      `)
    } else {
      users = await prisma.$queryRawUnsafe(`
        SELECT u.id, u.name, u.email,
               COALESCE(cp.role, 'member') as role,
               COALESCE(cp.xp, 0) as xp,
               cp.last_seen
        FROM User u
        LEFT JOIN community_profiles cp ON cp.user_id = u.id
        ORDER BY COALESCE(cp.xp, 0) DESC
      `)
    }

    const now = Date.now()
    const result = users.map(u => ({
      id: Number(u.id),
      name: u.name || u.email?.split('@')[0] || 'User',
      role: u.role || 'member',
      xp: Number(u.xp) || 0,
      online: u.last_seen ? (now - new Date(u.last_seen).getTime()) < ONLINE_THRESHOLD_MS : false,
    }))

    return NextResponse.json(result)
  } catch (e) {
    console.error('community/users error:', e)
    return NextResponse.json([], { status: 200 })
  }
}
