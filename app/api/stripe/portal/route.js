import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  await ensureMigrated()
  const userId = parseInt(session.user.id)
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT stripe_customer_id FROM "User" WHERE id = $1`, userId)
    : await prisma.$queryRawUnsafe(`SELECT stripe_customer_id FROM "User" WHERE id = ?`, userId)

  const customerId = rows[0]?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'Kein Stripe-Konto verknüpft' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
