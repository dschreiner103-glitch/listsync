import { prisma, ensureMigrated } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureMigrated()
  const userId = Number(session.user.id)
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')

  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(
        `SELECT id, title, price, "buyPrice", status, images, lagerplatz, category, brand, size, color, condition FROM "Listing" WHERE "userId" = $1 ORDER BY lagerplatz ASC, "createdAt" DESC`,
        userId
      )
    : await prisma.$queryRawUnsafe(
        `SELECT id, title, price, buyPrice, status, images, lagerplatz, category, brand, size, color, condition FROM "Listing" WHERE userId = ? ORDER BY lagerplatz ASC, createdAt DESC`,
        userId
      )

  const listings = rows.map(l => ({
    ...l,
    images: JSON.parse(l.images || '[]'),
    lagerplatz: l.lagerplatz || '',
  }))

  return NextResponse.json(listings)
}
