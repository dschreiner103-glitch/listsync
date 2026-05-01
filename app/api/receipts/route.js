import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/receipts – list all receipts for user
export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  const userId = Number(session.user.id)
  const receipts = await prisma.receipt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(receipts.map(r => ({ ...r, data: JSON.parse(r.data || '{}') })))
}

// POST /api/receipts – create a new receipt with sequential number
export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  const userId = Number(session.user.id)

  const body = await req.json()
  const { type = 'sale', listingId, periodFrom, periodTo, totalNet = 0, data = {} } = body

  // Atomic: get + increment receipt counter
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: { nextReceiptNo: { increment: 1 } },
  })
  const no = settings.nextReceiptNo - 1 // value before increment
  const year = new Date().getFullYear()
  const receiptNo = type === 'monthly'
    ? `SAM-${year}-${String(no).padStart(4, '0')}`
    : `RE-${year}-${String(no).padStart(4, '0')}`

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo,
      type,
      listingId: listingId ? Number(listingId) : null,
      userId,
      periodFrom: periodFrom ? new Date(periodFrom) : null,
      periodTo:   periodTo   ? new Date(periodTo)   : null,
      totalNet:   Number(totalNet),
      data:       JSON.stringify(data),
    }
  })

  return NextResponse.json({ ...receipt, receiptNo, data })
}
