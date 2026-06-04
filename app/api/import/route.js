import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const isPostgres = () => !!process.env.DATABASE_URL?.startsWith('postgres')

// Baut eine saubere Beschreibung mit verstecktem vintedId-Marker am Ende
function buildDescription(description, vintedId) {
  const clean = (description || '').replace(/\n?\[vintedId:\d+\]/g, '').trim()
  const tag = vintedId ? `\n[vintedId:${vintedId}]` : ''
  return clean + tag
}

// Setzt Raw-SQL-Felder (likes, material) die der Prisma-Client evtl. noch nicht kennt
async function setRawFields(listingId, { likes, material }) {
  const pg = isPostgres()
  const updates = []
  const args = []
  if (likes !== undefined && likes !== null) { updates.push('likes'); args.push(Number(likes) || 0) }
  if (material) { updates.push('material'); args.push(material) }
  if (!updates.length) return
  const setClause = updates.map((f, i) => pg ? `${f} = $${i + 1}` : `${f} = ?`).join(', ')
  const idPlaceholder = pg ? `$${updates.length + 1}` : '?'
  await prisma.$executeRawUnsafe(
    `UPDATE "Listing" SET ${setClause} WHERE id = ${idPlaceholder}`,
    ...args, listingId
  )
}

// Suche Listing per vintedId (steht in der description als [vintedId:XXX])
async function findByVintedId(userId, vintedId) {
  if (!vintedId) return null
  return prisma.listing.findFirst({
    where: { userId, description: { contains: `[vintedId:${vintedId}]` } }
  })
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    const userId = Number(session.user.id)
    await ensureMigrated()

    const { sales = [], purchases = [], listings = [], account = '' } = await req.json()

    let created = 0
    let skipped = 0
    let updated = 0

    // ── Verkäufe importieren (status: verkauft) ─────────────────────────────
    for (const item of sales) {
      const existing = await findByVintedId(userId, item.vintedId)

      if (existing) {
        // Listing existiert bereits → falls noch 'aktiv', auf 'verkauft' updaten
        if (existing.status === 'aktiv' || existing.status === 'entwurf') {
          const soldDate = item.soldAt ? new Date(item.soldAt) : new Date()
          await prisma.listing.update({
            where: { id: existing.id },
            data: {
              status:    'verkauft',
              updatedAt: soldDate,
              // Bild updaten falls das bisherige leer war
              ...(item.images?.length && JSON.parse(existing.images || '[]').length === 0
                ? { images: JSON.stringify(item.images.slice(0, 8)) }
                : {}),
            }
          })
          updated++
        } else {
          skipped++
        }
        continue
      }

      await prisma.listing.create({
        data: {
          userId,
          title:       (item.title || '').substring(0, 200),
          description: buildDescription(item.description, item.vintedId),
          price:       Number(item.price) || 0,
          buyPrice:    Number(item.buyPrice) || 0,
          status:      'verkauft',
          platforms:   JSON.stringify(['vinted']),
          images:      JSON.stringify((item.images || []).slice(0, 8)),
          brand:       item.brand || '',
          size:        item.size  || '',
          color:       item.color || '',
          condition:   item.condition || 'Gut',
          category:    'Sonstiges',
          createdAt:   item.soldAt ? new Date(item.soldAt) : undefined,
          updatedAt:   item.soldAt ? new Date(item.soldAt) : undefined,
        }
      })
      created++
    }

    // ── Einkäufe importieren (status: inaktiv) ──────────────────────────────
    for (const item of purchases) {
      const existing = await findByVintedId(userId, item.vintedId)
      if (existing) { skipped++; continue }

      await prisma.listing.create({
        data: {
          userId,
          title:       (item.title || '').substring(0, 200),
          description: buildDescription(item.description, item.vintedId),
          price:       0,
          buyPrice:    Number(item.buyPrice) || 0,
          status:      'inaktiv',
          platforms:   JSON.stringify(['vinted']),
          images:      JSON.stringify((item.images || []).slice(0, 8)),
          brand:       item.brand || '',
          size:        item.size  || '',
          color:       item.color || '',
          condition:   item.condition || 'Gut',
          category:    'Sonstiges',
          createdAt:   item.boughtAt ? new Date(item.boughtAt) : undefined,
          updatedAt:   item.boughtAt ? new Date(item.boughtAt) : undefined,
        }
      })
      created++
    }

    // ── Aktive Listings importieren (status: aktiv) ─────────────────────────
    for (const item of listings) {
      const existing = await findByVintedId(userId, item.vintedId)

      if (existing) {
        // Alle Felder aktualisieren die jetzt vollständiger sind
        const updateData = {}
        if (item.views > 0)     updateData.views     = Number(item.views)
        if (item.brand)         updateData.brand      = item.brand
        if (item.size)          updateData.size       = item.size
        if (item.color)         updateData.color      = item.color
        if (item.condition)     updateData.condition  = item.condition
        if (item.category && item.category !== 'Sonstiges') updateData.category = item.category
        if (item.shipSize)      updateData.shipSize    = item.shipSize
        if (item.description)   updateData.description = buildDescription(item.description, item.vintedId)
        if (item.images?.length) updateData.images = JSON.stringify(item.images.slice(0, 8))
        const hasRaw = item.likes > 0 || item.material
        if (Object.keys(updateData).length > 0 || hasRaw) {
          if (Object.keys(updateData).length > 0) {
            await prisma.listing.update({ where: { id: existing.id }, data: updateData })
          }
          await setRawFields(existing.id, { likes: item.likes, material: item.material })
          updated++
        } else {
          skipped++
        }
        continue
      }

      const created_listing = await prisma.listing.create({
        data: {
          userId,
          title:       (item.title || '').substring(0, 200),
          description: buildDescription(item.description, item.vintedId),
          price:       Number(item.price) || 0,
          buyPrice:    0,
          status:      'aktiv',
          platforms:   JSON.stringify(['vinted']),
          images:      JSON.stringify((item.images || []).slice(0, 8)),
          brand:       item.brand     || '',
          size:        item.size      || '',
          color:       item.color     || '',
          condition:   item.condition || 'Gut',
          category:    item.category  || 'Sonstiges',
          shipSize:    item.shipSize  || '',
          views:       Number(item.views) || 0,
        }
      })
      // likes + material via raw SQL (neue Felder)
      await setRawFields(created_listing.id, { likes: item.likes, material: item.material })
      created++
    }

    return NextResponse.json({ ok: true, created, skipped, updated })
  } catch(e) {
    console.error('[import]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
