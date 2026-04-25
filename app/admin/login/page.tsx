import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  async function handleSignIn(formData: FormData) {
    'use server'
    try {
      await signIn('credentials', {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        redirectTo: '/admin',
      })
    } catch (err) {
      if (err instanceof AuthError) {
        redirect('/admin/login?error=1')
      }
      throw err
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="Klickables" width={56} height={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-black text-navy">Admin Login</h1>
          <p className="text-navy/50 text-sm mt-1">Klickables Dashboard</p>
        </div>

        <form action={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-navy mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-navy mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple transition-colors"
            />
          </div>
          {error && <p className="text-red-500 text-sm">Invalid email or password</p>}
          <Button type="submit" size="lg" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
