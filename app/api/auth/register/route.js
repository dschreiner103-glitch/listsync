import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { email, password, name } = await req.json()

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

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('[Register]', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
