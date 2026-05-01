import { prisma } from '@/lib/prisma'
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const existing = await ownsListing(session.user.id, params.id)
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const data = await req.json()
  const update = {}
  if (data.status     !== undefined) update.status     = data.status
  if (data.price      !== undefined) update.price      = Number(data.price)
  if (data.platforms  !== undefined) update.platforms  = JSON.stringify(data.platforms)
  if (data.images     !== undefined) update.images     = JSON.stringify(data.images)
  if (data.views      !== undefined) update.views      = Number(data.views)
  if (data.days       !== undefined) update.days       = Number(data.days)
  if (data.relistedAt !== undefined) update.relistedAt = new Date(data.relistedAt)
  if (data.brand      !== undefined) update.brand      = data.brand
  if (data.size       !== undefined) update.size       = data.size
  if (data.color      !== undefined) update.color      = data.color
  if (data.shipping   !== undefined) update.shipping   = JSON.stringify(data.shipping)
  if (data.shipSize   !== undefined) update.shipSize   = data.shipSize

  const listing = await prisma.listing.update({
    where: { id: Number(params.id) },
    data: update,
  })
  return NextResponse.json({
    ...listing,
    platforms: JSON.parse(listing.platforms),
    images:    JSON.parse(listing.images || '[]'),
    shipping:  JSON.parse(listing.shipping || '[]'),
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
