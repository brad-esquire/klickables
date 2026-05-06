import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, or SVG files are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const filename = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  if (process.env.USE_LOCAL_DB === 'true') {
    const { writeFile, mkdir } = await import('fs/promises')
    const { join } = await import('path')
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos')
    await mkdir(uploadDir, { recursive: true })
    const basename = filename.replace('logos/', '')
    await writeFile(join(uploadDir, basename), buffer)
    return NextResponse.json({ url: `/uploads/logos/${basename}` })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
