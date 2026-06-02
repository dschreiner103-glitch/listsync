import Stripe from 'stripe'
import { prisma, ensureMigrated } from './prisma'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

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

export async function getUserPlan(userId) {
  await ensureMigrated()
  const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
  const rows = isPostgres
    ? await prisma.$queryRawUnsafe(`SELECT plan, plan_status, plan_ends_at FROM "User" WHERE id = $1`, parseInt(userId))
    : await prisma.$queryRawUnsafe(`SELECT plan, plan_status, plan_ends_at FROM "User" WHERE id = ?`, parseInt(userId))
  const user = rows[0]
  if (!user) return 'free'
  if (user.plan === 'lifetime') return 'lifetime'
  if (user.plan === 'pro' && user.plan_status === 'active') return 'pro'
  return 'free'
}
