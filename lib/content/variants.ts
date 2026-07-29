import { createPublicClient } from '@/lib/supabase/public'

/**
 * A resume variant. NOTE: `note` (which job this was for) is deliberately never
 * selected here — it is private, and anon has no column grant for it.
 */
export type Variant = {
  id: string
  slug: string
  label: string
  headline: string | null
}

const SAFE_COLUMNS = 'id, slug, label, headline'

export async function getVariants(): Promise<Variant[]> {
  const sb = createPublicClient()
  const { data, error } = await sb.from('variants').select(SAFE_COLUMNS).order('slug')
  if (error) throw error
  return (data ?? []) as Variant[]
}

export async function getVariantBySlug(slug: string): Promise<Variant | null> {
  const sb = createPublicClient()
  const { data, error } = await sb
    .from('variants')
    .select(SAFE_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return (data as Variant) ?? null
}

/**
 * Entry ids selected for a variant, in their variant order.
 * An empty result means "include everything visible" (per the schema's design).
 */
export async function getVariantEntryIds(variantId: string): Promise<string[]> {
  const sb = createPublicClient()
  const { data, error } = await sb
    .from('variant_entries')
    .select('entry_id, sort_order')
    .eq('variant_id', variantId)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((r) => r.entry_id)
}
