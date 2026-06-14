import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Admin-E-Mails in .env / Vercel: ADMIN_EMAILS=deine@email.de,zweite@email.de
export function isAdminEmail(email) {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}

// Liefert die Session nur zurück, wenn der eingeloggte Nutzer Admin ist — sonst null.
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null
  return session
}
