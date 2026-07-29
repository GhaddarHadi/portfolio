import { createPublicClient } from '@/lib/supabase/public'
import type { MediaRow } from '@/lib/database.types'

export type Media = MediaRow & { url: string }

/** Public URL for a file in the `media` storage bucket. */
export function mediaPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${base}/storage/v1/object/public/media/${storagePath}`
}

function withUrl(row: MediaRow): Media {
  return { ...row, url: mediaPublicUrl(row.storage_path) }
}

export async function getMediaByEntry(entryIds: string[]): Promise<Record<string, Media[]>> {
  const out: Record<string, Media[]> = {}
  if (entryIds.length === 0) return out

  const sb = createPublicClient()
  const { data, error } = await sb
    .from('media')
    .select('*')
    .in('entry_id', entryIds)
    .order('sort_order')
  if (error) throw error

  for (const row of data ?? []) {
    if (!row.entry_id) continue
    ;(out[row.entry_id] ??= []).push(withUrl(row))
  }
  return out
}
