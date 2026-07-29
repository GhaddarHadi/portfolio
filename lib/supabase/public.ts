import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Cookieless anon client for PUBLIC reads.
 *
 * Public pages are statically generated — they must not read request cookies
 * (that would force dynamic rendering). This client carries no session, so RLS
 * evaluates it as an anonymous visitor: only `visible` rows come back. That is
 * exactly what the public site should ever see.
 *
 * Admin reads that need drafts use the cookie-based server client instead.
 */
let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing. Copy .env.local.example to .env.local and fill it in.',
    )
  }
  cached ??= createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
