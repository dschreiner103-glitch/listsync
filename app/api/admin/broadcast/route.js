import { NextResponse } from 'next/server'
import { prisma, ensureMigrated } from '@/lib/prisma'
import { checkAdminCode, ADMIN_TEST_EMAIL } from '@/lib/admin'
import { sendBroadcast, basicEmailHtml } from '@/lib/email'

export async function POST(req) {
  if (!checkAdminCode(req.headers.get('x-admin-code'))) {
    return NextResponse.json({ error: 'Falscher Code' }, { status: 403 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY ist nicht gesetzt (in Vercel/.env eintragen).' }, { status: 400 })
  }

  const { subject, message, testOnly } = await req.json()
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Betreff und Nachricht erforderlich' }, { status: 400 })
  }

  await ensureMigrated()
  const rows = await prisma.$queryRawUnsafe(`SELECT email FROM "User" WHERE email IS NOT NULL AND email != ''`)
  let recipients = rows.map(r => r.email)

  // Testmodus: nur an die feste Admin-Adresse senden
  if (testOnly) recipients = [ADMIN_TEST_EMAIL]

  const html = basicEmailHtml({ heading: subject.trim(), body: message })
  const result = await sendBroadcast({ subject: subject.trim(), html, recipients })

  return NextResponse.json({ ...result, recipients: recipients.length, testOnly: !!testOnly })
}
