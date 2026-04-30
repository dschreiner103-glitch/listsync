import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, relistDays: 5, dayGoal: 150, monthGoal: 500 }
  })
}

export async function GET() {
  try {
    const settings = await ensureSettings()
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    await ensureSettings()
    const updateData = {}
    if (body.relistDays !== undefined) updateData.relistDays = Number(body.relistDays)
    if (body.dayGoal    !== undefined) updateData.dayGoal    = Number(body.dayGoal)
    if (body.monthGoal  !== undefined) updateData.monthGoal  = Number(body.monthGoal)
    const settings = await prisma.settings.update({ where: { id: 1 }, data: updateData })
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
