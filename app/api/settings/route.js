import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureSettings() {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, relistDays: 5, dayGoal: 0, monthGoal: 0, shopName: '', address: '', taxId: '', kleinunternehmer: true }
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
    const u = {}
    if (body.relistDays       !== undefined) u.relistDays       = Number(body.relistDays)
    if (body.dayGoal          !== undefined) u.dayGoal          = Number(body.dayGoal)
    if (body.monthGoal        !== undefined) u.monthGoal        = Number(body.monthGoal)
    if (body.shopName         !== undefined) u.shopName         = String(body.shopName)
    if (body.address          !== undefined) u.address          = String(body.address)
    if (body.taxId            !== undefined) u.taxId            = String(body.taxId)
    if (body.kleinunternehmer !== undefined) u.kleinunternehmer = Boolean(body.kleinunternehmer)
    const settings = await prisma.settings.update({ where: { id: 1 }, data: u })
    return NextResponse.json(settings)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
