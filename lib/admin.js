import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

// Fest hinterlegte Admins (funktionieren ohne Env-Variable in Vercel).
// Weitere können zusätzlich über ADMIN_EMAILS in .env / Vercel ergänzt werden.
const DEFAULT_ADMINS = [
  'dschreiner103@gmail.com',
  'schreinerdenny@gmail.com',
]

export function isAdminEmail(email) {
  if (!email) return false
  const fromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  const list = [...DEFAULT_ADMINS.map(e => e.toLowerCase()), ...fromEnv]
  return list.includes(email.toLowerCase())
}

// Liefert die Session nur zurück, wenn der eingeloggte Nutzer Admin ist — sonst null.
export async function getAdminSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdminEmail(session.user.email)) return null
  return session
}
