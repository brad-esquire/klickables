export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import CustomClickerForm from '@/components/shop/CustomClickerForm'
import ImageGallery from '@/components/shop/ImageGallery'

export const metadata = {
  title: 'Custom Clicker Order — Klickables',
}

async function getCustomClickerProduct(): Promise<{ images: string[]; description: string | null } | null> {
  const { data } = await supabase
    .from('products')
    .select('images, description')
    .eq('slug', 'custom-clicker')
    .single()
  return data as { images: string[]; description: string | null } | null
}

export default async function CustomClickerPage() {
  const product = await getCustomClickerProduct()

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Image gallery */}
        <div>
          <ImageGallery images={product?.images ?? []} alt="Custom Clicker" />
        </div>

        {/* Form */}
        <div>
          <h1 className="text-4xl font-black text-navy mb-2">Custom Branded Clickers</h1>
          {product?.description ? (
            <p className="text-navy/60 text-lg leading-relaxed mb-5">{product.description}</p>
          ) : (
            <p className="text-navy/60 text-lg leading-relaxed mb-5">
              Order clickers with your business colors and logo printed on every single one.
              Perfect for events, giveaways, or team swag.
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="bg-purple/10 text-purple font-bold px-3 py-1 rounded-full text-sm">Min. 50 clickers</span>
            <span className="bg-pink/10 text-pink font-bold px-3 py-1 rounded-full text-sm">$2.00 each</span>
            <span className="bg-navy/10 text-navy font-bold px-3 py-1 rounded-full text-sm">Two custom colors</span>
            <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-sm">Your logo on every clicker</span>
          </div>

          <CustomClickerForm />
        </div>
      </div>
    </div>
  )
}
