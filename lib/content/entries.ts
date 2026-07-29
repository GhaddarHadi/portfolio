import { createPublicClient } from '@/lib/supabase/public'
import type { EntryRow } from '@/lib/database.types'

/** An entry with its jsonb `data` narrowed to an object. */
export type Entry = Omit<EntryRow, 'data'> & { data: Record<string, unknown> }

export function parseEntry(row: EntryRow): Entry {
  return {
    ...row,
    data:
      row.data && typeof row.data === 'object' && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : {},
  }
}

export async function getEntriesBySection(sectionId: string): Promise<Entry[]> {
  const sb = createPublicClient()
  const { data, error } = await sb
    .from('entries')
    .select('*')
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(parseEntry)
}

/** All entries for a set of sections, grouped by section id. One round trip. */
export async function getEntriesForSections(
  sectionIds: string[],
): Promise<Record<string, Entry[]>> {
  const out: Record<string, Entry[]> = {}
  if (sectionIds.length === 0) return out

  const sb = createPublicClient()
  const { data, error } = await sb
    .from('entries')
    .select('*')
    .in('section_id', sectionIds)
    .order('sort_order', { ascending: true })
  if (error) throw error

  for (const row of data ?? []) {
    ;(out[row.section_id] ??= []).push(parseEntry(row))
  }
  return out
}

export async function getEntryBySlug(slug: string): Promise<Entry | null> {
  const sb = createPublicClient()
  const { data, error } = await sb.from('entries').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? parseEntry(data) : null
}

/** Slugs of all visible entries — for generateStaticParams on /work/[slug]. */
export async function getAllEntrySlugs(): Promise<string[]> {
  const sb = createPublicClient()
  const { data, error } = await sb.from('entries').select('slug').not('slug', 'is', null)
  if (error) throw error
  return (data ?? []).map((r) => r.slug).filter((s): s is string => Boolean(s))
}
