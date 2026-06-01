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

      migrationDone = true
    })()
  }
  await migrationPromise
}
