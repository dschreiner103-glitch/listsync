import { getStripe } from '@/lib/stripe'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[Webhook] Signatur-Fehler:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  await ensureMigrated()
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

  async function updateUser(userId, fields) {
    const entries = Object.entries(fields)
    if (isPostgres) {
      const sets = entries.map(([k], i) => `"${k}" = $${i + 2}`).join(', ')
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET ${sets} WHERE id = $1`,
        parseInt(userId),
        ...entries.map(([, v]) => v)
      )
    } else {
      const sets = entries.map(([k]) => `${k} = ?`).join(', ')
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET ${sets} WHERE id = ?`,
        ...entries.map(([, v]) => v),
        parseInt(userId)
      )
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { userId, plan } = session.metadata || {}
      if (!userId || !plan) break

      if (plan === 'lifetime') {
        await updateUser(userId, { plan: 'lifetime', plan_status: 'active', plan_ends_at: '', onboarded: 1 })
      } else if (plan === 'pro') {
        const subId = session.subscription
        await updateUser(userId, {
          plan: 'pro',
          plan_status: 'active',
          stripe_subscription_id: subId || '',
          plan_ends_at: '',
          onboarded: 1,
        })
      }
      console.log(`[Webhook] Plan aktiviert: userId=${userId} plan=${plan}`)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const customerId = sub.customer
      const rows = isPostgres
        ? await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = $1`, customerId)
        : await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = ?`, customerId)
      if (!rows[0]) break
      const userId = rows[0].id
      const status = sub.status === 'active' ? 'active' : sub.status
      const endsAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : ''
      await updateUser(userId, { plan_status: status, plan_ends_at: endsAt })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const customerId = sub.customer
      const rows = isPostgres
        ? await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = $1`, customerId)
        : await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = ?`, customerId)
      if (!rows[0]) break
      const userId = rows[0].id
      await updateUser(userId, { plan: 'free', plan_status: 'active', stripe_subscription_id: '', plan_ends_at: '' })
      console.log(`[Webhook] Plan auf Free zurückgesetzt: userId=${userId}`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer
      const rows = isPostgres
        ? await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = $1`, customerId)
        : await prisma.$queryRawUnsafe(`SELECT id FROM "User" WHERE stripe_customer_id = ?`, customerId)
      if (!rows[0]) break
      await updateUser(rows[0].id, { plan_status: 'past_due' })
      break
    }
  }

  return NextResponse.json({ received: true })
}
