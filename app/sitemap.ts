import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                              lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/shop`,                          lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/about`,                         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/fidget-clickers-anxiety-adhd`,  lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ]

  const db = createAdminClient()
  const { data: products } = await db
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => {
    const slug = p.slug as string
    const updatedAt = p.updated_at as string | null
    return {
      url: `${SITE_URL}/shop/${slug}`,
      lastModified: updatedAt ? new Date(updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  })

  return [...staticRoutes, ...productRoutes]
}
