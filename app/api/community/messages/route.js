import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith('postgres')

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMigrated()

  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || 'allgemein'
  const after   = parseInt(searchParams.get('after') || '0')

  try {
    let messages
    if (isPostgres()) {
      messages = after > 0
        ? await prisma.$queryRawUnsafe(`SELECT id, channel, user_id, user_name, content, image_url, created_at FROM community_messages WHERE channel = $1 AND id > $2 ORDER BY created_at ASC LIMIT 100`, channel, after)
        : await prisma.$queryRawUnsafe(`SELECT id, channel, user_id, user_name, content, image_url, created_at FROM community_messages WHERE channel = $1 ORDER BY created_at DESC LIMIT 50`, channel)
    } else {
      messages = after > 0
        ? await prisma.$queryRawUnsafe(`SELECT id, channel, user_id, user_name, content, image_url, created_at FROM community_messages WHERE channel = ? AND id > ? ORDER BY created_at ASC LIMIT 100`, channel, after)
        : await prisma.$queryRawUnsafe(`SELECT id, channel, user_id, user_name, content, image_url, created_at FROM community_messages WHERE channel = ? ORDER BY created_at DESC LIMIT 50`, channel)
    }

    const result = after > 0 ? messages : [...messages].reverse()
    return NextResponse.json(result)
  } catch (e) {
    console.error('community GET error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMigrated()

  const { channel = 'allgemein', content, image_url = '' } = await req.json()
  if (!content?.trim() && !image_url) return NextResponse.json({ error: 'Leere Nachricht' }, { status: 400 })

  const userId   = session.user.id
  const userName = session.user.name || session.user.email || 'User'

  try {
    let msg
    if (isPostgres()) {
      const rows = await prisma.$queryRawUnsafe(
        `INSERT INTO community_messages (channel, user_id, user_name, content, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING id, channel, user_id, user_name, content, image_url, created_at`,
        channel, userId, userName, content?.trim() || '', image_url
      )
      msg = rows[0]
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO community_messages (channel, user_id, user_name, content, image_url) VALUES (?,?,?,?,?)`,
        channel, userId, userName, content?.trim() || '', image_url
      )
      const rows = await prisma.$queryRawUnsafe(`SELECT id, channel, user_id, user_name, content, image_url, created_at FROM community_messages WHERE id = last_insert_rowid()`)
      msg = rows[0]
    }
    return NextResponse.json(msg)
  } catch (e) {
    console.error('community POST error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
