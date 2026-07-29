'use client'

import { signOut } from '@/app/admin/actions'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="lettering text-[10px] text-slate hover:text-redline">
        Sign out
      </button>
    </form>
  )
}
