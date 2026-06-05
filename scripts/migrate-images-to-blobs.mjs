/**
 * One-shot copy of every image/video currently hosted on Supabase Storage
 * into Netlify Blobs, then rewrites the product image URLs in Postgres.
 *
 * Usage:
 *   Dry run (default):  node scripts/migrate-images-to-blobs.mjs
 *   Actually migrate:   node scripts/migrate-images-to-blobs.mjs --apply
 *
 * Requires env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NETLIFY_SITE_ID
 *   NETLIFY_AUTH_TOKEN  (personal access token from app.netlify.com/user/applications)
 */

import { createClient } from '@supabase/supabase-js'
import { getStore } from '@netlify/blobs'

const APPLY = process.argv.includes('--apply')

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NETLIFY_SITE_ID', 'NETLIFY_AUTH_TOKEN']
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}`)
  process.exit(1)
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const store = getStore({
  name: 'media',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_AUTH_TOKEN,
})

console.log(APPLY ? '⚠️  APPLY mode — rows will be updated.' : 'ℹ️  Dry run. Pass --apply to actually migrate.')

const { data: products, error } = await sb.from('products').select('id, slug, images')
if (error) { console.error(error); process.exit(1) }

let totalToMigrate = 0
let totalSkipped = 0
let totalBytes = 0

for (const p of products) {
  const imgs = p.images || []
  if (imgs.length === 0) continue
  const newImages = []
  let changed = false
  for (const url of imgs) {
    if (!url.includes('supabase.co/storage')) {
      newImages.push(url)
      totalSkipped++
      continue
    }
    const filename = url.split('/').pop()
    const r = await fetch(url)
    if (!r.ok) {
      console.warn(`  ✗ ${p.slug}: failed to fetch ${filename} (HTTP ${r.status})`)
      newImages.push(url)
      continue
    }
    const buf = await r.arrayBuffer()
    const contentType = r.headers.get('content-type') || 'application/octet-stream'
    totalBytes += buf.byteLength
    totalToMigrate++
    if (APPLY) {
      await store.set(filename, buf, { metadata: { contentType } })
    }
    newImages.push(`/api/media/${filename}`)
    changed = true
    console.log(`  ${APPLY ? '✓' : '·'} ${p.slug}: ${filename} (${Math.round(buf.byteLength / 1024)} KB, ${contentType})`)
  }
  if (changed && APPLY) {
    const { error: updErr } = await sb.from('products').update({ images: newImages }).eq('id', p.id)
    if (updErr) console.error(`  ✗ ${p.slug}: failed to update row — ${updErr.message}`)
  }
}

console.log(`\nFiles to migrate: ${totalToMigrate}  Already off-Supabase: ${totalSkipped}  Total bytes: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
if (!APPLY) console.log('Rerun with --apply to perform the migration.')
