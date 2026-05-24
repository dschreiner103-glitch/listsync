import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Fehlende Spalten automatisch hinzufügen (Vercel-Prod-DB kann hinter dem Schema zurückliegen)
async function runMigrations() {
  try {
    await prisma.$executeRaw`ALTER TABLE Listing ADD COLUMN material TEXT NOT NULL DEFAULT ''`
  } catch {}
  // weitere zukünftige Migrationen hier hinzufügen
}
runMigrations()
