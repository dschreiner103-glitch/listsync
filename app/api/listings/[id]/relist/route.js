import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { varyTitle, varyDescription } from '@/lib/relistVariation'

const isPg = () => !!process.env.DATABASE_URL?.startsWith('postgres')
const stripTag = d => (d || '').replace(/\n?\[vintedId:\d+\]/g, '').trim()
const getTag   = d => (d || '').match(/\[vintedId:(\d+)\]/)?.[1] || ''

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    await ensureMigrated()

    const id     = Number(params.id)
    const userId = Number(session.user.id)
    const pg     = isPg()
    const { mode = 'publish' } = await req.json().catch(() => ({}))
    const isDraft = mode === 'draft'
    const newStatus = isDraft ? 'entwurf' : 'aktiv'

    // Alle Spalten roh lesen (Original-Felder kennt der Prisma-Client evtl. nicht)
    const rows = pg
      ? await prisma.$queryRawUnsafe(`SELECT * FROM "Listing" WHERE id = $1 AND "userId" = $2`, id, userId)
      : await prisma.$queryRawUnsafe(`SELECT * FROM "Listing" WHERE id = ? AND userId = ?`, id, userId)
    const existing = rows?.[0]
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    // Originale (pristine) bestimmen – beim ersten Relist aus dem aktuellen Stand sichern
    const origTitle  = existing.originalTitle || existing.title || ''
    const origDesc   = existing.originalDescription || stripTag(existing.description)
    const origImages = (existing.originalImages && existing.originalImages !== '')
      ? existing.originalImages
      : (existing.images || '[]')
    const count = Number(existing.reuploadCount || 0) + 1

    // Variation IMMER aus dem Original ableiten (kein Aufschaukeln)
    const newTitle    = varyTitle(origTitle, count)
    const oldVintedId = getTag(existing.description)
    // vintedId-Tag erhalten bis die neue ID eingefangen ist → Sync matcht weiter denselben Datensatz
    const newDesc = varyDescription(origDesc, count) + (oldVintedId ? `\n[vintedId:${oldVintedId}]` : '')
    const now = new Date()

    await prisma.listing.update({
      where: { id },
      // Entwurf: nur speichern, Relist-Timer nicht setzen. Hochladen: relistedAt = jetzt (Relisted-Tab)
      data:  { title: newTitle, description: newDesc, days: 0, status: newStatus, ...(isDraft ? {} : { relistedAt: now }) },
    })

    // Originale sichern + Reupload-Zähler (Raw-SQL für die neuen Spalten)
    if (pg) {
      await prisma.$executeRawUnsafe(
        `UPDATE "Listing" SET "originalTitle"=$1, "originalDescription"=$2, "originalImages"=$3, "reuploadCount"=$4 WHERE id=$5`,
        origTitle, origDesc, origImages, count, id)
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "Listing" SET "originalTitle"=?, "originalDescription"=?, "originalImages"=?, "reuploadCount"=? WHERE id=?`,
        origTitle, origDesc, origImages, count, id)
    }

    let images = []
    try { images = JSON.parse(origImages) } catch {}

    // Original-Bilder zurückgeben → Extension transformiert sie frisch (1 Generation vom Original)
    return NextResponse.json({
      id, title: newTitle, description: newDesc, status: newStatus,
      relistedAt: isDraft ? null : now.toISOString(), days: 0, reuploadCount: count,
      images, oldVintedId,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
