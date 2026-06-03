import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Migration-Promise – wird beim ersten Import gestartet und gecacht
// API-Routes müssen await ensureMigrated() aufrufen bevor sie die DB nutzen
let migrationDone = false
let migrationPromise = null

export async function ensureMigrated() {
  if (migrationDone) return
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const isPostgres = !!process.env.DATABASE_URL?.startsWith('postgres')
      const cols = [
        ['material',      "TEXT NOT NULL DEFAULT ''"],
        ['stil',          "TEXT NOT NULL DEFAULT ''"],
        ['beinform',      "TEXT NOT NULL DEFAULT ''"],
        ['taillenumfang', "TEXT NOT NULL DEFAULT ''"],
        ['kaCategory',    "TEXT NOT NULL DEFAULT ''"],
        ['address',       "TEXT NOT NULL DEFAULT ''"],
        ['ebayCategory',  "TEXT NOT NULL DEFAULT ''"],
        ['lagerplatz',    "TEXT NOT NULL DEFAULT ''"],
      ]
      for (const [col, def] of cols) {
        try {
          const sql = isPostgres
            ? `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "${col}" ${def}`
            : `ALTER TABLE "Listing" ADD COLUMN ${col} ${def}`
          await prisma.$executeRawUnsafe(sql)
          console.log(`[DB] ${col}-Spalte hinzugefügt`)
        } catch {
          // Spalte existiert bereits – kein Problem
        }
      }

      // Community profiles (Rollen, XP, Online-Status)
      try {
        if (isPostgres) {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS community_profiles (
              user_id INTEGER PRIMARY KEY,
              role TEXT NOT NULL DEFAULT 'member',
              xp INTEGER NOT NULL DEFAULT 0,
              last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS community_profiles (
              user_id INTEGER PRIMARY KEY,
              role TEXT NOT NULL DEFAULT 'member',
              xp INTEGER NOT NULL DEFAULT 0,
              last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }
      } catch { /* already exists */ }

      // Community messages Tabelle
      try {
        if (isPostgres) {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS community_messages (
              id SERIAL PRIMARY KEY,
              channel TEXT NOT NULL DEFAULT 'allgemein',
              user_id TEXT NOT NULL DEFAULT '',
              user_name TEXT NOT NULL DEFAULT '',
              content TEXT NOT NULL DEFAULT '',
              image_url TEXT NOT NULL DEFAULT '',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `)
        } else {
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS community_messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              channel TEXT NOT NULL DEFAULT 'allgemein',
              user_id TEXT NOT NULL DEFAULT '',
              user_name TEXT NOT NULL DEFAULT '',
              content TEXT NOT NULL DEFAULT '',
              image_url TEXT NOT NULL DEFAULT '',
              created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
          `)
        }
      } catch { /* already exists */ }

      // User subscription fields (Stripe)
      const userCols = [
        ['stripe_customer_id',     "TEXT NOT NULL DEFAULT ''"],
        ['stripe_subscription_id', "TEXT NOT NULL DEFAULT ''"],
        ['plan',                   "TEXT NOT NULL DEFAULT 'free'"],
        ['plan_status',            "TEXT NOT NULL DEFAULT 'active'"],
        ['plan_ends_at',           "TEXT NOT NULL DEFAULT ''"],
        ['onboarded',              "INTEGER NOT NULL DEFAULT 0"],
      ]
      for (const [col, def] of userCols) {
        try {
          const sql = isPostgres
            ? `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "${col}" ${def}`
            : `ALTER TABLE "User" ADD COLUMN ${col} ${def}`
          await prisma.$executeRawUnsafe(sql)
        } catch { /* already exists */ }
      }

      migrationDone = true
    })()
  }
  await migrationPromise
}
