import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, PLANS } from '@/lib/stripe'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  await ensureMigrated()
  const { plan } = await req.json()
  if (!['pro', 'lifetime'].includes(plan)) {
    return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT id, email, name, stripe_customer_id FROM "User" WHERE id = $1`, userId)
    : await prisma.$queryRawUnsafe(`SELECT id, email, name, stripe_customer_id FROM "User" WHERE id = ?`, userId)
  const user = rows[0]
  if (!user) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })

  let customerId = user.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || user.email,
      metadata: { userId: String(userId) },
    })
    customerId = customer.id
    if (isPostgres) {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET stripe_customer_id = $1 WHERE id = $2`, customerId, userId)
    } else {
      await prisma.$executeRawUnsafe(`UPDATE "User" SET stripe_customer_id = ? WHERE id = ?`, customerId, userId)
    }
  }

  const planConfig = PLANS[plan]
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?success=1&plan=${plan}`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId: String(userId), plan },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
