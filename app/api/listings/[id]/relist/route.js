import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req, { params }) {
  try {
    const id = parseInt(params.id)
    const listing = await prisma.listing.update({
      where: { id },
      data: {
        days: 0,
        relistedAt: new Date(),
        status: 'aktiv'
      }
    })
    return NextResponse.json(listing)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
