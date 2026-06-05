import { NextResponse } from 'next/server'

// ── Produktion: handleUpload = Client sendet direkt zu Vercel Blob CDN ─────────
// Server generiert nur ein Token (~10ms), kein Datei-Transfer durch den Server.
// Lokal: Dateien werden in public/uploads/ gespeichert (kein Blob-Token nötig).

export async function POST(req) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const contentType = req.headers.get('content-type') || ''

    // Token-Request vom @vercel/blob Client SDK (JSON body)
    if (contentType.includes('application/json')) {
      const { handleUpload } = await import('@vercel/blob/client')
      const body = await req.json()
      try {
        const jsonResponse = await handleUpload({
          body,
          request: req,
          onBeforeGenerateToken: async () => ({
            allowedContentTypes: [
              'image/jpeg', 'image/jpg', 'image/png',
              'image/gif', 'image/webp', 'image/heic', 'image/heif',
            ],
            maximumSizeInBytes: 15 * 1024 * 1024, // 15 MB
            // WICHTIG: gleicher Dateiname (z.B. "image.jpg" vom Handy) würde sonst
            // das Bild eines anderen Artikels überschreiben → eindeutige URL erzwingen
            addRandomSuffix: true,
          }),
          onUploadCompleted: async ({ blob }) => {
            console.log('[Upload] ✓', blob.url)
          },
        })
        return NextResponse.json(jsonResponse)
      } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 400 })
      }
    }

    // Fallback: Server-Upload (z.B. aus der Extension oder Import-Route)
    const { put } = await import('@vercel/blob')
    const formData = await req.formData()
    const files = formData.getAll('files').filter(f => f && typeof f !== 'string')
    const urls = await Promise.all(files.map(async file => {
      const ext  = file.name.split('.').pop() || 'jpg'
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const blob = await put(name, file, { access: 'public' })
      return blob.url
    }))
    return NextResponse.json({ urls })
  }

  // Lokal: public/uploads/
  const { writeFile, mkdir } = await import('fs/promises')
  const { join } = await import('path')
  const { existsSync } = await import('fs')
  const formData = await req.formData()
  const files = formData.getAll('files').filter(f => f && typeof f !== 'string')
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
  const urls = await Promise.all(files.map(async file => {
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext    = file.name.split('.').pop() || 'jpg'
    const name   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(join(uploadDir, name), buffer)
    return `/uploads/${name}`
  }))
  return NextResponse.json({ urls })
}
