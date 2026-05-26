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
      const cols = [
        ['material',      "TEXT NOT NULL DEFAULT ''"],
        ['stil',          "TEXT NOT NULL DEFAULT ''"],
        ['beinform',      "TEXT NOT NULL DEFAULT ''"],
        ['taillenumfang', "TEXT NOT NULL DEFAULT ''"],
      ]
      for (const [col, def] of cols) {
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE "Listing" ADD COLUMN ${col} ${def}`)
          console.log(`[DB] ${col}-Spalte hinzugefügt`)
        } catch {
          // Spalte existiert bereits – kein Problem
        }
      }
      migrationDone = true
    })()
  }
  await migrationPromise
}
