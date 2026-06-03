import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Markiert den User als "Free-Plan gewählt" → onboarded, Zugriff aufs Dashboard.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  await ensureMigrated()
  const userId = parseInt(session.user.id)
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  if (isPostgres) {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET plan = 'free', plan_status = 'active', onboarded = 1 WHERE id = $1`, userId)
  } else {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET plan = 'free', plan_status = 'active', onboarded = 1 WHERE id = ?`, userId)
  }
  return NextResponse.json({ ok: true })
}
