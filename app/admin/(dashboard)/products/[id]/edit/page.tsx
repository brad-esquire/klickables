export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'Edit Product — Admin' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('products').select('*, product_variants(*)').eq('id', id).single()
  if (!data) notFound()

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Edit Product</h1>
      <ProductForm product={data} />
    </div>
  )
}
