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

// Normalisiert ein Datum aus dem Sync zu ISO-String – oder '' wenn keins/ungültig.
// WICHTIG: niemals auf "heute" defaulten – fehlt das echte Datum, bleibt das Feld leer.
// Für listedAt (TEXT-Spalte, nicht im Prisma-Schema) – ISO-String ist hier korrekt.
function toIso(value) {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toISOString()
}

// soldAt IST ein Prisma-DateTime-Feld (schema.prisma) → DB-abhängig schreiben:
//   SQLite  → epoch-ms (Integer); ISO-Text würde SELECT * sprengen (Prisma-Mapping).
//   Postgres→ ISO-String (timestamp); Integer-ms würde der timestamp-Spalte einen Typfehler werfen.
// Kein echtes Datum → null (NICHT '' – leerer String bricht das DateTime-Mapping ebenfalls).
function soldAtVal(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return isPostgres() ? d.toISOString() : d.getTime()
}

// Setzt Raw-SQL-Felder (likes, material, soldAt, listedAt, boughtAt) die der Prisma-Client evtl. noch nicht kennt
async function setRawFields(listingId, { likes, material, soldAt, listedAt, boughtAt }) {
  const pg = isPostgres()
  const updates = []
  const args = []
  if (likes !== undefined && likes !== null) { updates.push('likes');     args.push(Number(likes) || 0) }
  if (material)                              { updates.push('material');   args.push(material) }
  if (soldAt   !== undefined)                { updates.push('"soldAt"');   args.push(soldAt) }
  if (listedAt !== undefined)                { updates.push('"listedAt"'); args.push(listedAt) }
  if (boughtAt !== undefined)                { updates.push('"boughtAt"'); args.push(boughtAt) }
  if (!updates.length) return
  const setClause = updates.map((f, i) => pg ? `${f} = $${i + 1}` : `${f} = ?`).join(', ')
  const idPlaceholder = pg ? `$${updates.length + 1}` : '?'
  await prisma.$executeRawUnsafe(
    `UPDATE "Listing" SET ${setClause} WHERE id = ${idPlaceholder}`,
    ...args, listingId
  )
}

// Findet die listing_accounts-ID für einen Account-Namen (vinted), legt ihn sonst an.
// So bekommt jeder gesyncte Artikel eine Account-Zuordnung für den Account-Vergleich.
async function resolveVintedAccountId(accountName) {
  const name = (accountName || '').trim()
  if (!name) return null
  const pg = isPostgres()
  const found = pg
    ? await prisma.$queryRawUnsafe(`SELECT id FROM listing_accounts WHERE platform='vinted' AND (LOWER(name)=LOWER($1) OR LOWER(username)=LOWER($1)) LIMIT 1`, name)
    : await prisma.$queryRawUnsafe(`SELECT id FROM listing_accounts WHERE platform='vinted' AND (LOWER(name)=LOWER(?) OR LOWER(username)=LOWER(?)) LIMIT 1`, name, name)
  if (found?.length) return Number(found[0].id)
  // Auto-anlegen
  if (pg) {
    const r = await prisma.$queryRawUnsafe(`INSERT INTO listing_accounts (platform, name, username) VALUES ('vinted', $1, $1) RETURNING id`, name)
    return Number(r[0].id)
  }
  await prisma.$executeRawUnsafe(`INSERT INTO listing_accounts (platform, name, username) VALUES ('vinted', ?, ?)`, name, name)
  const r = await prisma.$queryRawUnsafe(`SELECT last_insert_rowid() AS id`)
  return Number(r[0].id)
}

// Setzt account_ids[platform] = accountId und behält andere Plattformen bei (Merge).
async function mergeAccountId(listingId, platform, accountId) {
  if (!accountId) return
  const pg = isPostgres()
  const rows = await prisma.$queryRawUnsafe(
    `SELECT account_ids FROM "Listing" WHERE id = ${pg ? '$1' : '?'}`, listingId
  )
  let obj = {}
  try { obj = JSON.parse(rows?.[0]?.account_ids || '{}') } catch {}
  obj[platform] = accountId
  await prisma.$executeRawUnsafe(
    `UPDATE "Listing" SET account_ids = ${pg ? '$1' : '?'} WHERE id = ${pg ? '$2' : '?'}`,
    JSON.stringify(obj), listingId
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

    // Account-Name → listing_accounts-ID (für account-genauen Vergleich); legt ihn bei Bedarf an
    const vintedAccountId = await resolveVintedAccountId(account)

    let created = 0
    let skipped = 0
    let updated = 0

    // ── Verkäufe importieren (status: verkauft) ─────────────────────────────
    for (const item of sales) {
      const existing = await findByVintedId(userId, item.vintedId)

      if (existing) {
        // Listing existiert bereits → falls noch 'aktiv', auf 'verkauft' updaten
        if (existing.status === 'aktiv' || existing.status === 'entwurf') {
          await prisma.listing.update({
            where: { id: existing.id },
            data: {
              status: 'verkauft',
              // Bild updaten falls das bisherige leer war
              ...(item.images?.length && JSON.parse(existing.images || '[]').length === 0
                ? { images: JSON.stringify(item.images.slice(0, 8)) }
                : {}),
            }
          })
          // aktiv→verkauft Übergang: echtes Datum nutzen, sonst HEUTE (Extension hat den Verkauf
          // gerade erkannt). Nur hier – nicht beim Bulk-Import historischer Verkäufe (create-Zweig unten).
          await setRawFields(existing.id, { soldAt: soldAtVal(item.soldAt || new Date()) })
          await mergeAccountId(existing.id, 'vinted', vintedAccountId)
          updated++
        } else {
          skipped++
        }
        continue
      }

      const createdSale = await prisma.listing.create({
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
        }
      })
      // Echtes Verkaufsdatum getrennt speichern – null, wenn der Sync keins liefert.
      await setRawFields(createdSale.id, { soldAt: soldAtVal(item.soldAt) })
      await mergeAccountId(createdSale.id, 'vinted', vintedAccountId)
      created++
    }

    // ── Einkäufe importieren (status: inaktiv) ──────────────────────────────
    for (const item of purchases) {
      const existing = await findByVintedId(userId, item.vintedId)
      if (existing) { skipped++; continue }

      const createdPurchase = await prisma.listing.create({
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
      await setRawFields(createdPurchase.id, { boughtAt: toIso(item.boughtAt) })
      await mergeAccountId(createdPurchase.id, 'vinted', vintedAccountId)
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
        // Account-Zuordnung immer aktualisieren (auch wenn sonst nichts geändert wird)
        await mergeAccountId(existing.id, 'vinted', vintedAccountId)
        const listedIso = toIso(item.listedAt || item.createdAt)
        const hasRaw = item.likes > 0 || item.material || listedIso
        if (Object.keys(updateData).length > 0 || hasRaw) {
          if (Object.keys(updateData).length > 0) {
            await prisma.listing.update({ where: { id: existing.id }, data: updateData })
          }
          // listedAt nur setzen wenn echtes Datum vorliegt – sonst bestehendes nicht überschreiben
          await setRawFields(existing.id, {
            likes: item.likes, material: item.material,
            listedAt: listedIso || undefined,
          })
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
      // likes + material + Upload-Datum via raw SQL (neue Felder)
      await setRawFields(created_listing.id, {
        likes: item.likes, material: item.material,
        listedAt: toIso(item.listedAt || item.createdAt),
      })
      await mergeAccountId(created_listing.id, 'vinted', vintedAccountId)
      created++
    }

    return NextResponse.json({ ok: true, created, skipped, updated })
  } catch(e) {
    console.error('[import]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
