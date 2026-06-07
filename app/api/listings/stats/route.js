import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith('postgres')

// Schneller Stats-Sync: aktualisiert NUR views + likes anhand der vintedId.
// Wird vom automatischen Hintergrund-Sync der Extension aufgerufen.
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    const userId = Number(session.user.id)
    await ensureMigrated()

    const { stats = [] } = await req.json()  // [{ vintedId, views, likes }]
    let updated = 0

    for (const s of stats) {
      if (!s.vintedId) continue
      const existing = await prisma.listing.findFirst({
        where: { userId, description: { contains: `[vintedId:${s.vintedId}]` } }
      })
      if (!existing) continue

      // views via Prisma, likes via raw SQL (neues Feld)
      await prisma.listing.update({
        where: { id: existing.id },
        data: { views: Number(s.views) || 0 }
      })
      const pg = isPostgres()
      // Alten likes-Stand roh lesen (Prisma-Client kennt das Feld evtl. nicht)
      const cur = await prisma.$queryRawUnsafe(
        pg ? `SELECT likes FROM "Listing" WHERE id = $1` : `SELECT likes FROM "Listing" WHERE id = ?`,
        existing.id
      )
      const oldLikes = Number(cur?.[0]?.likes || 0)
      const newLikes = Number(s.likes) || 0
      // Steigt die Favoriten-Zahl, alten Stand als prevLikes festhalten → Karte zeigt "+N neu".
      // Sinkt/gleich → prevLikes unangetastet (sonst verschwindet das Badge zu früh).
      if (newLikes > oldLikes) {
        await prisma.$executeRawUnsafe(
          pg ? `UPDATE "Listing" SET likes = $1, "prevLikes" = $2 WHERE id = $3`
             : `UPDATE "Listing" SET likes = ?, "prevLikes" = ? WHERE id = ?`,
          newLikes, oldLikes, existing.id
        )
      } else {
        await prisma.$executeRawUnsafe(
          pg ? `UPDATE "Listing" SET likes = $1 WHERE id = $2`
             : `UPDATE "Listing" SET likes = ? WHERE id = ?`,
          newLikes, existing.id
        )
      }
      updated++
    }

    return NextResponse.json({ ok: true, updated })
  } catch (e) {
    console.error('[stats]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
