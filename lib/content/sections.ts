import { createPublicClient } from '@/lib/supabase/public'
import type { SectionRow } from '@/lib/database.types'
import type { FieldDef, Layout } from '@/lib/schema/field-types'

/** A section with its field_schema parsed into typed FieldDef[]. */
export type Section = Omit<SectionRow, 'field_schema' | 'layout'> & {
  layout: Layout
  field_schema: FieldDef[]
}

export function parseSection(row: SectionRow): Section {
  return {
    ...row,
    layout: row.layout as Layout,
    field_schema: Array.isArray(row.field_schema)
      ? (row.field_schema as unknown as FieldDef[])
      : [],
  }
}

/**
 * All visible sections, in render order. The cookieless client means RLS only
 * ever returns `visible` sections here — drafts never reach the public site.
 */
export async function getSections(): Promise<Section[]> {
  const sb = createPublicClient()
  const { data, error } = await sb
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []).map(parseSection)
}

export async function getSectionBySlug(slug: string): Promise<Section | null> {
  const sb = createPublicClient()
  const { data, error } = await sb.from('sections').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data ? parseSection(data) : null
}
