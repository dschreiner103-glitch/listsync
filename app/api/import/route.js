import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    const userId = Number(session.user.id)

    const { sales = [], purchases = [], account = '' } = await req.json()

    let created = 0
    let skipped = 0

    // Import sales (status: verkauft)
    for (const item of sales) {
      // Skip duplicates by vintedId if provided
      if (item.vintedId) {
        const exists = await prisma.listing.findFirst({
          where: { userId, description: { contains: `vintedId:${item.vintedId}` } }
        })
        if (exists) { skipped++; continue }
      }

      await prisma.listing.create({
        data: {
          userId,
          title:       (item.title || '').substring(0, 200),
          description: (item.description || '') + (item.vintedId ? `\n[vintedId:${item.vintedId}]` : ''),
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
          // soldAt null = Datum unbekannt, createdAt wird als updatedAt gesetzt damit nicht heute erscheint
          createdAt:   item.soldAt ? new Date(item.soldAt) : undefined,
          updatedAt:   item.soldAt ? new Date(item.soldAt) : undefined,
        }
      })
      created++
    }

    // Import purchases (status: inaktiv, buyPrice set, price=0)
    for (const item of purchases) {
      if (item.vintedId) {
        const exists = await prisma.listing.findFirst({
          where: { userId, description: { contains: `vintedId:${item.vintedId}` } }
        })
        if (exists) { skipped++; continue }
      }

      await prisma.listing.create({
        data: {
          userId,
          title:       (item.title || '').substring(0, 200),
          description: (item.description || '') + (item.vintedId ? `\n[vintedId:${item.vintedId}]` : ''),
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

    return NextResponse.json({ ok: true, created, skipped })
  } catch(e) {
    console.error('[import]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
