import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function parseRow(r) {
  return { ...r, id: Number(r.id), connected: Boolean(Number(r.connected)) }
}

export async function GET() {
  await ensureMigrated()
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM listing_accounts ORDER BY platform, id`
  )
  return NextResponse.json(rows.map(parseRow))
}

export async function POST(req) {
  await ensureMigrated()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { platform, name, username } = await req.json()
  if (!platform || !name?.trim()) {
    return NextResponse.json({ error: 'platform und name sind erforderlich' }, { status: 400 })
  }

  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

  if (isPostgres) {
    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO listing_accounts (platform, name, username) VALUES ($1, $2, $3) RETURNING *`,
      platform, name.trim(), (username || '').trim()
    )
    return NextResponse.json(parseRow(rows[0]))
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO listing_accounts (platform, name, username) VALUES (?, ?, ?)`,
      platform, name.trim(), (username || '').trim()
    )
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM listing_accounts WHERE rowid = last_insert_rowid()`
    )
    return NextResponse.json(parseRow(rows[0]))
  }
}

export async function PATCH(req) {
  await ensureMigrated()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await req.json()
  const { id, name, username, connected } = body
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  const updates = []
  const args = []

  if (name     !== undefined) { updates.push(isPostgres ? `name=$${args.length+1}`     : 'name=?');     args.push(name.trim()) }
  if (username !== undefined) { updates.push(isPostgres ? `username=$${args.length+1}` : 'username=?'); args.push((username||'').trim()) }
  if (connected!== undefined) { updates.push(isPostgres ? `connected=$${args.length+1}`: 'connected=?');args.push(connected ? 1 : 0) }

  if (!updates.length) return NextResponse.json({ error: 'Keine Felder' }, { status: 400 })

  args.push(Number(id))
  const idParam = isPostgres ? `$${args.length}` : '?'
  await prisma.$executeRawUnsafe(
    `UPDATE listing_accounts SET ${updates.join(', ')} WHERE id=${idParam}`, ...args
  )

  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT * FROM listing_accounts WHERE id=$1`, Number(id))
    : await prisma.$queryRawUnsafe(`SELECT * FROM listing_accounts WHERE id=?`, Number(id))

  return NextResponse.json(parseRow(rows[0]))
}

export async function DELETE(req) {
  await ensureMigrated()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id erforderlich' }, { status: 400 })

  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  if (isPostgres) {
    await prisma.$executeRawUnsafe(`DELETE FROM listing_accounts WHERE id=$1`, Number(id))
  } else {
    await prisma.$executeRawUnsafe(`DELETE FROM listing_accounts WHERE id=?`, Number(id))
  }

  return NextResponse.json({ ok: true })
}
