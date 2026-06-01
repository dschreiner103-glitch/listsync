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
    // Parse @mentions and create notifications
    try {
      // Underscores in mentions represent spaces (e.g. @Demo_User → Demo User)
      const mentions = [...(content?.matchAll(/@(\w+)/g) || [])].map(m => m[1].replace(/_/g, ' ').toLowerCase())
      if (mentions.length > 0) {
        const allUsers = isPostgres()
          ? await prisma.$queryRawUnsafe(`SELECT id, name FROM "User"`)
          : await prisma.$queryRawUnsafe(`SELECT id, name FROM User`)
        for (const mentionName of mentions) {
          const target = allUsers.find(u => (u.name||'').toLowerCase() === mentionName)
          if (target && Number(target.id) !== userId) {
            if (isPostgres()) {
              await prisma.$executeRawUnsafe(
                `INSERT INTO community_notifications (user_id, from_name, channel, message_id) VALUES ($1,$2,$3,$4)`,
                Number(target.id), userName, channel, Number(msg.id)
              )
            } else {
              await prisma.$executeRawUnsafe(
                `INSERT INTO community_notifications (user_id, from_name, channel, message_id) VALUES (?,?,?,?)`,
                Number(target.id), userName, channel, Number(msg.id)
              )
            }
          }
        }
      }
    } catch { /* non-critical */ }

    // XP +5 for sending a message
    try {
      if (isPostgres()) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO community_profiles (user_id, xp, last_seen)
          VALUES ($1, 5, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id) DO UPDATE SET xp = community_profiles.xp + 5, last_seen = CURRENT_TIMESTAMP
        `, userId)
      } else {
        await prisma.$executeRawUnsafe(`
          INSERT OR REPLACE INTO community_profiles (user_id, role, xp, last_seen)
          VALUES (?, COALESCE((SELECT role FROM community_profiles WHERE user_id = ?), 'member'),
                     COALESCE((SELECT xp FROM community_profiles WHERE user_id = ?), 0) + 5,
                     CURRENT_TIMESTAMP)
        `, userId, userId, userId)
      }
    } catch { /* non-critical */ }

    return NextResponse.json(msg)
  } catch (e) {
    console.error('community POST error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
