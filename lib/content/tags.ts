import { createPublicClient } from '@/lib/supabase/public'
import type { TagRow } from '@/lib/database.types'

export type Tag = TagRow

export async function getTags(): Promise<Tag[]> {
  const sb = createPublicClient()
  const { data, error } = await sb.from('tags').select('*').order('name')
  if (error) throw error
  return data ?? []
}

/**
 * Map of entry id -> its tags, for a batch of entries. One round trip.
 * Powers the stack chips on each card and the tag filter on the project grid.
 */
export async function getTagsByEntry(entryIds: string[]): Promise<Record<string, Tag[]>> {
  const out: Record<string, Tag[]> = {}
  if (entryIds.length === 0) return out

  const sb = createPublicClient()
  const { data, error } = await sb
    .from('entry_tags')
    .select('entry_id, tags(*)')
    .in('entry_id', entryIds)
  if (error) throw error

  for (const row of data ?? []) {
    const tag = row.tags as unknown as Tag | null
    if (!tag) continue
    ;(out[row.entry_id] ??= []).push(tag)
  }
  return out
}
