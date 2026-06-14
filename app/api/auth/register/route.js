import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { ensureStripeCustomer } from '@/lib/stripe'

export async function POST(req) {
  try {
    await ensureMigrated()
    const { email, password, name, phone } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email und Passwort erforderlich' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert' }, { status: 409 })
    }

    const hashed = await hash(password, 12)
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, name: name || null },
    })

    // phone ist ein Raw-SQL-Feld (stale Prisma-Schema) → separat schreiben
    if (phone) {
      try {
        const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
        if (isPostgres) {
          await prisma.$executeRawUnsafe(`UPDATE "User" SET phone = $1 WHERE id = $2`, String(phone).trim(), user.id)
        } else {
          await prisma.$executeRawUnsafe(`UPDATE "User" SET phone = ? WHERE id = ?`, String(phone).trim(), user.id)
        }
      } catch (e) { console.error('[Register] phone save failed', e) }
    }

    // Stripe-Kunde anlegen → jeder Nutzer erscheint im Stripe-Dashboard.
    // Darf die Registrierung nie blockieren, daher try/catch.
    try {
      await ensureStripeCustomer(user.id)
    } catch (e) { console.error('[Register] Stripe customer failed', e) }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('[Register]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
