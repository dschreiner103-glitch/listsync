import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const listings = await prisma.listing.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(listings.map(l => ({
    ...l,
    platforms: JSON.parse(l.platforms),
    images:    JSON.parse(l.images   || '[]'),
    shipping:  JSON.parse(l.shipping || '[]'),
  })))
}

export async function POST(req) {
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
    }
  })
  return NextResponse.json({
    ...listing,
    platforms: JSON.parse(listing.platforms),
    images:    JSON.parse(listing.images),
    shipping:  JSON.parse(listing.shipping),
  }, { status: 201 })
}
