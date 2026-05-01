import { prisma } from '@/lib/prisma'
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

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const data = await req.json()
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
      platforms:   JSON.stringify(data.platforms || []),
      images:      JSON.stringify(data.images    || []),
      userId:      Number(session.user.id),
    }
  })
  return NextResponse.json(parseListing(listing), { status: 201 })
}
