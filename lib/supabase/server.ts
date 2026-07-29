import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Server-side Supabase client, scoped to the current request's session cookies.
 *
 * - Anonymous visitor  -> runs under the anon key, sees only what the public
 *   RLS policies allow (visible rows).
 * - Logged-in owner    -> RLS owner policies apply, so drafts become visible.
 *
 * Row Level Security decides what comes back — not this code. That is the whole
 * point of routing every read through here.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase env vars missing. Copy .env.local.example to .env.local and fill it in.',
    )
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // In Server Components cookies are read-only; the middleware/route
        // handler refreshes them instead, so swallow the write here.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  })
}
