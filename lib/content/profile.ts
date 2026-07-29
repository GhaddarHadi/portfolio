import { cache } from 'react'
import { createPublicClient } from '@/lib/supabase/public'
import type { ProfileRow } from '@/lib/database.types'

export type Social = { label: string; url: string; icon?: string }

export type Profile = Omit<ProfileRow, 'socials' | 'theme'> & {
  socials: Social[]
  theme: Record<string, unknown>
}

function parse(row: ProfileRow): Profile {
  return {
    ...row,
    socials: Array.isArray(row.socials) ? (row.socials as unknown as Social[]) : [],
    theme:
      row.theme && typeof row.theme === 'object'
        ? (row.theme as Record<string, unknown>)
        : {},
  }
}

// cache(): deduped within a single request, so the layout's title block and the
// page can both call getProfile() without a second round trip.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const sb = createPublicClient()
  const { data, error } = await sb.from('profile').select('*').maybeSingle()
  if (error) throw error
  return data ? parse(data) : null
})
