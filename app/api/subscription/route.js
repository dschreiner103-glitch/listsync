import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPlan, PLANS } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const plan = await getUserPlan(session.user.id)
  return NextResponse.json({ plan, config: PLANS[plan] })
}
