import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/admin/LogoutButton'

export const dynamic = 'force-dynamic'

// Chrome + server-side guard for every authenticated admin page. (Middleware
// also gates these routes — this is defense in depth, not the only check.)
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-bond text-ink">
      <header className="border-b border-ink/20">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-5">
            <Link href="/admin" className="font-display text-sm font-bold uppercase tracking-wide">
              Admin
            </Link>
            <nav className="lettering flex gap-4 text-[10px] text-slate">
              <Link href="/admin" className="hover:text-ink">
                Sections
              </Link>
              <Link href="/admin/profile" className="hover:text-ink">
                Profile
              </Link>
              <a href="/admin/export" className="hover:text-ink">
                Export JSON
              </a>
              <Link href="/" className="hover:text-ink">
                View site ↗
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="lettering text-[10px] text-slate">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  )
}
