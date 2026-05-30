import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  const listing = await prisma.listing.findFirst({ where: { id: Number(params.id), userId: Number(session.user.id) } })
  if (!listing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json({ ...listing, platforms: JSON.parse(listing.platforms), images: JSON.parse(listing.images||'[]'), shipping: JSON.parse(listing.shipping||'[]') })
}

async function ownsListing(userId, id) {
  const listing = await prisma.listing.findFirst({
    where: { id: Number(id), userId: Number(userId) },
  })
  return listing
}

export async function PATCH(req, { params }) {
  await ensureMigrated()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const existing = await ownsListing(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const data = await req.json()
  const update = {}
  if (data.title      !== undefined) update.title      = data.title
  if (data.status     !== undefined) update.status     = data.status
  if (data.price      !== undefined) update.price      = Number(data.price)
  if (data.buyPrice   !== undefined) update.buyPrice   = Number(data.buyPrice)
  if (data.platforms  !== undefined) update.platforms  = JSON.stringify(data.platforms)
  if (data.images     !== undefined) update.images     = JSON.stringify(data.images)
  if (data.views      !== undefined) update.views      = Number(data.views)
  if (data.days       !== undefined) update.days       = Number(data.days)
  if (data.relistedAt !== undefined) update.relistedAt = new Date(data.relistedAt)
  if (data.updatedAt  !== undefined) update.updatedAt  = new Date(data.updatedAt)
  if (data.category   !== undefined) update.category   = data.category
  if (data.brand      !== undefined) update.brand      = data.brand
  if (data.size       !== undefined) update.size       = data.size
  if (data.color      !== undefined) update.color      = data.color
  if (data.condition  !== undefined) update.condition  = data.condition
  if (data.description!== undefined) update.description= data.description
  if (data.shipping   !== undefined) update.shipping   = JSON.stringify(data.shipping)
  if (data.shipSize   !== undefined) update.shipSize   = data.shipSize
  // Note: material/stil/beinform/taillenumfang are excluded here and handled via raw SQL below

  // addPlatform: fügt eine Platform zum bestehenden platforms-Array hinzu (von Extension gesendet)
  if (data.addPlatform !== undefined) {
    const current = JSON.parse(existing.platforms || '[]')
    if (!current.includes(data.addPlatform)) {
      update.platforms = JSON.stringify([...current, data.addPlatform])
    }
  }

  const listing = await prisma.listing.update({
    where: { id: Number(params.id) },
    data: update,
  })

  // Update new fields via raw SQL (bypasses stale Prisma client validation)
  const rawUpdates = []
  const rawArgs    = []
  if (data.material      !== undefined) { rawUpdates.push('material');       rawArgs.push(data.material) }
  if (data.stil          !== undefined) { rawUpdates.push('stil');           rawArgs.push(data.stil) }
  if (data.beinform      !== undefined) { rawUpdates.push('beinform');       rawArgs.push(data.beinform) }
  if (data.taillenumfang !== undefined) { rawUpdates.push('taillenumfang');  rawArgs.push(data.taillenumfang) }
  if (data.kaCategory    !== undefined) { rawUpdates.push('"kaCategory"');   rawArgs.push(data.kaCategory) }
  if (data.ebayCategory  !== undefined) { rawUpdates.push('"ebayCategory"'); rawArgs.push(data.ebayCategory) }

  if (rawUpdates.length) {
    const setParts = rawUpdates.map(f => `${f} = ?`).join(', ')
    await prisma.$executeRawUnsafe(
      `UPDATE "Listing" SET ${setParts} WHERE id = ?`,
      ...rawArgs, Number(params.id)
    )
  }

  return NextResponse.json({
    ...listing,
    platforms:     JSON.parse(listing.platforms),
    images:        JSON.parse(listing.images || '[]'),
    shipping:      JSON.parse(listing.shipping || '[]'),
    material:      data.material      !== undefined ? data.material      : (existing.material      || ''),
    stil:          data.stil          !== undefined ? data.stil          : (existing.stil          || ''),
    beinform:      data.beinform      !== undefined ? data.beinform      : (existing.beinform      || ''),
    taillenumfang: data.taillenumfang !== undefined ? data.taillenumfang : (existing.taillenumfang || ''),
    kaCategory:    data.kaCategory    !== undefined ? data.kaCategory    : (existing.kaCategory    || ''),
    ebayCategory:  data.ebayCategory  !== undefined ? data.ebayCategory  : (existing.ebayCategory  || ''),
  })
}

export async function DELETE(_, { params }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const existing = await ownsListing(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  await prisma.listing.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
