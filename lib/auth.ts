import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
        const password = String(credentials?.password ?? '')

        console.log('[auth] attempt - email:', email)
        console.log('[auth] ADMIN_EMAIL set:', !!process.env.ADMIN_EMAIL, '| value:', process.env.ADMIN_EMAIL)
        console.log('[auth] ADMIN_PASSWORD_HASH set:', !!process.env.ADMIN_PASSWORD_HASH, '| starts with:', process.env.ADMIN_PASSWORD_HASH?.slice(0, 7))

        if (!email || !password) { console.log('[auth] fail: missing email/password'); return null }
        if (email !== process.env.ADMIN_EMAIL) { console.log('[auth] fail: email mismatch'); return null }

        const hash = process.env.ADMIN_PASSWORD_HASH
        if (!hash) { console.log('[auth] fail: no hash'); return null }

        const valid = await bcrypt.compare(password, hash)
        console.log('[auth] bcrypt result:', valid)
        if (!valid) return null

        return { id: '1', email, name: 'Admin' }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: { strategy: 'jwt' },
})
