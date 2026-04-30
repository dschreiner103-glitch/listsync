import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PLATFORMS = ['ebay', 'vinted', 'kleinanzeigen']

async function ensurePlatforms() {
  for (const platform of PLATFORMS) {
    await prisma.platformAccount.upsert({
      where: { platform },
      update: {},
      create: { platform, connected: false }
    })
  }
}

export async function GET() {
  try {
    await ensurePlatforms()
    const accounts = await prisma.platformAccount.findMany()
    return NextResponse.json(accounts)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json()
    const { platform, connected, apiKey, username } = body
    const updateData = {}
    if (connected  !== undefined) updateData.connected = connected
    if (apiKey     !== undefined) updateData.apiKey    = apiKey
    if (username   !== undefined) updateData.username  = username

    const account = await prisma.platformAccount.upsert({
      where: { platform },
      update: updateData,
      create: {
        platform,
        connected: connected ?? false,
        apiKey:    apiKey    ?? null,
        username:  username  ?? null,
      }
    })
    return NextResponse.json(account)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
