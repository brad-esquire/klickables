import ProductForm from '@/components/admin/ProductForm'

export const metadata = { title: 'New Product — Admin' }

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Add Product</h1>
      <ProductForm />
    </div>
  )
}
