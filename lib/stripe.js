import Stripe from 'stripe'
import { prisma, ensureMigrated } from './prisma'

let _stripe = null
export function getStripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  return _stripe
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxListings: 5,
    maxPlatforms: 1,
    bulk: false,
    features: ['5 Listings', '1 Plattform pro Crosspost', 'Basis-Analytics'],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 9.99,
    maxListings: null,
    maxPlatforms: 3,
    bulk: true,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    features: ['Unlimitierte Listings', 'Alle 3 Plattformen', 'Bulk Crosspost', 'Vollständige Analytics', 'Prioritäts-Support'],
  },
  lifetime: {
    name: 'Lifetime',
    priceOnce: 79,
    maxListings: null,
    maxPlatforms: 3,
    bulk: true,
    stripePriceId: process.env.STRIPE_PRICE_LIFETIME,
    features: ['Alles aus Pro', 'Einmalige Zahlung', 'Für immer Pro', 'Alle zukünftigen Features'],
  },
}

// Admin-E-Mails bekommen immer Lifetime — gratis, ohne Zahlung.
// In .env / Vercel setzen: ADMIN_EMAILS=deine@email.de,zweite@email.de
function isAdminEmail(email) {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

// Liefert { plan, onboarded } für einen User.
// onboarded = hat einen Plan gewählt (free/pro/lifetime) oder Code eingelöst.
export async function getUserAccess(userId) {
  await ensureMigrated()
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT email, plan, plan_status, onboarded FROM "User" WHERE id = $1`, parseInt(userId))
    : await prisma.$queryRawUnsafe(`SELECT email, plan, plan_status, onboarded FROM "User" WHERE id = ?`, parseInt(userId))
  const user = rows[0]
  if (!user) return { plan: 'free', onboarded: false }
  if (isAdminEmail(user.email)) return { plan: 'lifetime', onboarded: true }   // Admin → immer voller Zugriff

  let plan = 'free'
  if (user.plan === 'lifetime') plan = 'lifetime'
  else if (user.plan === 'pro' && user.plan_status === 'active') plan = 'pro'

  const onboarded = !!user.onboarded || plan === 'pro' || plan === 'lifetime'
  return { plan, onboarded }
}

export async function getUserPlan(userId) {
  const { plan } = await getUserAccess(userId)
  return plan
}

// Legt für einen User einen Stripe-Kunden an (falls noch keiner existiert) und
// speichert dessen stripe_customer_id. So taucht jeder Nutzer — auch Free —
// im Stripe-Dashboard unter "Customers" auf (mit Email, Name, Telefon).
// Gibt die customerId zurück, oder null wenn kein Stripe-Key gesetzt / Fehler.
export async function ensureStripeCustomer(userId) {
  if (!process.env.STRIPE_SECRET_KEY) return null
  await ensureMigrated()
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  const id = parseInt(userId)

  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT id, email, name, phone, stripe_customer_id FROM "User" WHERE id = $1`, id)
    : await prisma.$queryRawUnsafe(`SELECT id, email, name, phone, stripe_customer_id FROM "User" WHERE id = ?`, id)
  const user = rows[0]
  if (!user) return null
  if (user.stripe_customer_id) return user.stripe_customer_id

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name || user.email,
    phone: user.phone || undefined,
    metadata: { userId: String(id) },
  })

  if (isPostgres) {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET stripe_customer_id = $1 WHERE id = $2`, customer.id, id)
  } else {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET stripe_customer_id = ? WHERE id = ?`, customer.id, id)
  }
  return customer.id
}
