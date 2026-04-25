import { createClient } from '@supabase/supabase-js'

function isLocalDb() {
  return process.env.USE_LOCAL_DB === 'true'
}

// ─── Local SQLite client (dev only) ──────────────────────────────────────────
// Imported lazily so the module is never bundled in production.
// Cast to ReturnType<typeof createClient> so all callers keep their Supabase types.
function getLocalAdminClient(): ReturnType<typeof createClient> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createLocalClient } = require('@/lib/db/local-client') as typeof import('./db/local-client')
  return createLocalClient() as unknown as ReturnType<typeof createClient>
}

// ─── Supabase browser client ──────────────────────────────────────────────────
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    )
  }
  return _supabase
}

// Named export used by public server components (reads with RLS)
export const supabase = {
  from: (...args: Parameters<ReturnType<typeof createClient>['from']>) => {
    if (isLocalDb()) return getLocalAdminClient().from(args[0])
    return getSupabase().from(...args)
  },
  rpc: (...args: Parameters<ReturnType<typeof createClient>['rpc']>) => {
    if (isLocalDb()) return Promise.resolve({ data: null, error: null }) as unknown as ReturnType<ReturnType<typeof createClient>['rpc']>
    return getSupabase().rpc(...args)
  },
}

// Server-only admin client — bypasses RLS, used in API routes
export function createAdminClient() {
  if (isLocalDb()) return getLocalAdminClient()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
