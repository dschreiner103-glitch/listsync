import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const id = parseInt(params.id)
    const existing = await prisma.listing.findFirst({
      where: { id, userId: Number(session.user.id) },
    })
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

    const listing = await prisma.listing.update({
      where: { id },
      data: { days: 0, relistedAt: new Date(), status: 'aktiv' },
    })
    return NextResponse.json(listing)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
