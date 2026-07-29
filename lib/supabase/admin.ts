import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Service-role client. BYPASSES Row Level Security.
 *
 * The `server-only` import above makes the build fail loudly if this file is
 * ever pulled into a client bundle — the service-role key must never reach the
 * browser. Reserve this for jobs with no user session (the weekly heartbeat).
 * The seed script builds its own service-role client because it runs outside
 * the Next.js runtime (see scripts/seed.ts).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL missing.')
  }
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
