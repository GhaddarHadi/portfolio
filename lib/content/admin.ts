import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { parseSection, type Section } from './sections'
import { parseEntry, type Entry } from './entries'
import { mediaPublicUrl, type Media } from './media'
import type { ProfileRow } from '@/lib/database.types'

/**
 * Admin reads run through the cookie-based session client, so RLS owner
 * policies apply and DRAFTS (visible = false) come back too — unlike the public
 * read layer, which only ever sees visible rows.
 */

export async function getAdminSections(): Promise<Section[]> {
  const sb = await createClient()
  const { data, error } = await sb.from('sections').select('*').order('sort_order')
  if (error) throw error
  return (data ?? []).map(parseSection)
}

export async function getAdminSection(id: string): Promise<Section | null> {
  const sb = await createClient()
  const { data, error } = await sb.from('sections').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data ? parseSection(data) : null
}

export async function getAdminEntries(sectionId: string): Promise<Entry[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('entries')
    .select('*')
    .eq('section_id', sectionId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map(parseEntry)
}

export async function getAdminProfile(): Promise<ProfileRow | null> {
  const sb = await createClient()
  const { data, error } = await sb.from('profile').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function getAdminEntryMedia(entryId: string): Promise<Media[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('media')
    .select('*')
    .eq('entry_id', entryId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((m) => ({ ...m, url: mediaPublicUrl(m.storage_path) }))
}

/** Tag names attached to an entry (for pre-filling the editor). */
export async function getAdminEntryTags(entryId: string): Promise<string[]> {
  const sb = await createClient()
  const { data, error } = await sb
    .from('entry_tags')
    .select('tags(name)')
    .eq('entry_id', entryId)
  if (error) throw error
  return (data ?? [])
    .map((r) => (r.tags as unknown as { name: string } | null)?.name)
    .filter((n): n is string => Boolean(n))
}
