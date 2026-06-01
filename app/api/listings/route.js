import { prisma, ensureMigrated } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function parseListing(l) {
  return {
    ...l,
    platforms: JSON.parse(l.platforms),
    images:    JSON.parse(l.images   || '[]'),
    shipping:  JSON.parse(l.shipping || '[]'),
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const listings = await prisma.listing.findMany({
    where:   { userId: Number(session.user.id) },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(listings.map(parseListing))
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  const userId = Number(session.user.id)

  // Optional: ?ids=1,2,3 löscht nur diese IDs, sonst alles
  const url  = new URL(req.url)
  const ids  = url.searchParams.get('ids')

  if (ids) {
    const idList = ids.split(',').map(Number).filter(Boolean)
    await prisma.listing.deleteMany({ where: { userId, id: { in: idList } } })
    return NextResponse.json({ ok: true, deleted: idList.length })
  }

  const { count } = await prisma.listing.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true, deleted: count })
}

export async function POST(req) {
  await ensureMigrated()
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const data = await req.json()
  try {
    // Create without material – the Prisma client may have a stale schema
    // that doesn't know about material yet. We set it via raw SQL afterwards.
    const listing = await prisma.listing.create({
      data: {
        title:       data.title,
        description: data.description || '',
        price:       Number(data.price),
        buyPrice:    Number(data.buyPrice || 0),
        condition:   data.condition  || 'Gut',
        category:    data.category   || 'Sonstiges',
        brand:       data.brand      || '',
        size:        data.size       || '',
        color:       data.color      || '',
        shipping:    JSON.stringify(data.shipping || []),
        shipSize:    data.shipSize || '',
        address:     data.address  || '',
        status:      ['entwurf','aktiv','inaktiv','verkauft'].includes(data.status) ? data.status : 'aktiv',
        platforms:   JSON.stringify(data.platforms || []),
        images:      JSON.stringify(data.images    || []),
        userId:      Number(session.user.id),
      }
    })
    // Set new fields via raw SQL (bypasses stale Prisma client validation)
    const material      = data.material      || ''
    const stil          = data.stil          || ''
    const beinform      = data.beinform      || ''
    const taillenumfang = data.taillenumfang || ''
    const kaCategory    = data.kaCategory    || ''
    const ebayCategory  = data.ebayCategory  || ''
    const lagerplatz    = data.lagerplatz    || ''
    await prisma.$executeRaw`UPDATE "Listing" SET material = ${material}, stil = ${stil}, beinform = ${beinform}, taillenumfang = ${taillenumfang}, "kaCategory" = ${kaCategory}, "ebayCategory" = ${ebayCategory}, lagerplatz = ${lagerplatz} WHERE id = ${listing.id}`
    return NextResponse.json({ ...parseListing(listing), material, stil, beinform, taillenumfang, kaCategory, ebayCategory, lagerplatz }, { status: 201 })
  } catch(e) {
    console.error('[API POST /listings]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
