import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5 MB
const MAX_GIF_SIZE   = 20 * 1024 * 1024  // 20 MB — animated GIFs can be large
const MAX_VIDEO_SIZE = 50 * 1024 * 1024  // 50 MB

// Returns a Supabase presigned upload URL so the browser uploads the file
// directly to storage, bypassing the Netlify function body-size limit.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contentType, size, filename } = await req.json()

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, GIF, MP4, WebM or MOV files are allowed' }, { status: 400 })
  }

  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType)
  const isGif   = contentType === 'image/gif'
  const maxSize  = isVideo ? MAX_VIDEO_SIZE : isGif ? MAX_GIF_SIZE : MAX_IMAGE_SIZE
  if (size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024)
    return NextResponse.json({ error: `File must be under ${mb} MB` }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase.storage
    .from('product-images')
    .createSignedUploadUrl(filename)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filename)

  return NextResponse.json({ uploadUrl: data.signedUrl, publicUrl })
}
