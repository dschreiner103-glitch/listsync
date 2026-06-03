import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Parst ACTIVATION_CODES env → { CODE: 'pro'|'lifetime' }
function getCodeMap() {
  const map = {}
  for (const pair of (process.env.ACTIVATION_CODES || '').split(',')) {
    const [code, plan] = pair.split(':').map(s => s?.trim())
    if (code && (plan === 'pro' || plan === 'lifetime')) {
      map[code.toUpperCase()] = plan
    }
  }
  return map
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  await ensureMigrated()
  const { code } = await req.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Bitte gib einen Code ein.' }, { status: 400 })
  }

  const plan = getCodeMap()[code.trim().toUpperCase()]
  if (!plan) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code.' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  if (isPostgres) {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET plan = $1, plan_status = 'active', plan_ends_at = '' WHERE id = $2`, plan, userId)
  } else {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET plan = ?, plan_status = 'active', plan_ends_at = '' WHERE id = ?`, plan, userId)
  }

  return NextResponse.json({ ok: true, plan })
}
