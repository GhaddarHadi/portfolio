import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next 16 renamed the "middleware" file convention to "proxy" (same API).
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// Only run on admin routes — public pages are static and need no session.
export const config = {
  matcher: ['/admin/:path*'],
}
