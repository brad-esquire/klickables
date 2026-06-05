import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStore } from '@netlify/blobs'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
]

// Netlify Functions cap incoming request bodies at ~6 MB. We sit just below that.
const MAX_SIZE = 5.5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, GIF, MP4, WebM or MOV files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 5.5 MB. For longer videos, please compress first.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  // Dev: write to public/uploads so the local SQLite + filesystem flow keeps working
  // without needing Netlify creds.
  if (process.env.USE_LOCAL_DB === 'true') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const buffer = Buffer.from(bytes)
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)
    return NextResponse.json({ url: `/uploads/${filename}` })
  }

  // Prod: write to Netlify Blobs. The site-scoped store survives deploys.
  const store = getStore({ name: 'media' })
  await store.set(filename, bytes, { metadata: { contentType: file.type } })
  return NextResponse.json({ url: `/api/media/${filename}` })
}
