import { NextRequest, NextResponse } from 'next/server'
import { getStore } from '@netlify/blobs'

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const filename = key.join('/')

  const store = getStore({ name: 'media' })
  const result = await store.getWithMetadata(filename, { type: 'arrayBuffer' })

  if (!result) return new NextResponse('Not found', { status: 404 })

  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const contentType =
    (result.metadata?.contentType as string | undefined) ?? EXT_TO_MIME[ext] ?? 'application/octet-stream'

  // Filenames already include a timestamp + random suffix, so the same key always
  // points to the same bytes — safe to cache aggressively on both browser and CDN.
  // `durable` opts into Netlify's persistent CDN cache that survives deploys.
  return new NextResponse(result.data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Netlify-CDN-Cache-Control': 'public, max-age=31536000, immutable, durable',
    },
  })
}
