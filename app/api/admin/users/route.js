import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { checkAdminCode } from '@/lib/admin'

export async function GET(req) {
  if (!checkAdminCode(req.headers.get('x-admin-code'))) {
    return NextResponse.json({ error: 'Falscher Code' }, { status: 403 })
  }

  await ensureMigrated()
  const sql = `SELECT id, email, name, phone, plan, plan_status, stripe_customer_id, createdAt FROM "User" ORDER BY id DESC`
  const rows = await prisma.$queryRawUnsafe(sql)

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
