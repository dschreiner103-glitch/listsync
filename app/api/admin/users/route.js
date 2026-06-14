import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  await ensureMigrated()
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  const sql = `SELECT id, email, name, phone, plan, plan_status, stripe_customer_id, createdAt FROM "User" ORDER BY id DESC`
  const rows = await prisma.$queryRawUnsafe(sql)

  // BigInt/Date robust serialisieren
  const users = rows.map(u => ({
    id: Number(u.id),
    email: u.email,
    name: u.name || '',
    phone: u.phone || '',
    plan: u.plan || 'free',
    planStatus: u.plan_status || '',
    inStripe: !!u.stripe_customer_id,
    createdAt: u.createdAt ? Number(u.createdAt) || u.createdAt : null,
  }))

  return NextResponse.json({ users, count: users.length })
}
