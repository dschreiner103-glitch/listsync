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
      try {
        await prisma.$executeRaw`ALTER TABLE "Listing" ADD COLUMN material TEXT NOT NULL DEFAULT ''`
        console.log('[DB] material-Spalte hinzugefügt')
      } catch {
        // Spalte existiert bereits – kein Problem
      }
      migrationDone = true
    })()
  }
  await migrationPromise
}
