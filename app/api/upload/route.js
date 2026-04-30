import { NextResponse } from 'next/server'

// Vercel Blob wird verwendet wenn BLOB_READ_WRITE_TOKEN gesetzt ist (Produktion)
// Lokal wird der public/uploads Ordner verwendet
async function uploadFile(file) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const ext  = file.name.split('.').pop() || 'jpg'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const blob = await put(name, file, { access: 'public' })
    return blob.url
  } else {
    // Lokale Speicherung
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const { existsSync } = await import('fs')
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext    = file.name.split('.').pop() || 'jpg'
    const name   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    await writeFile(join(uploadDir, name), buffer)
    return `/uploads/${name}`
  }
}

export async function POST(req) {
  const formData = await req.formData()
  const files    = formData.getAll('files')
  const urls     = []
  for (const file of files) {
    if (!file || typeof file === 'string') continue
    const url = await uploadFile(file)
    urls.push(url)
  }
  return NextResponse.json({ urls })
}
