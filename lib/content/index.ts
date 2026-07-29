/**
 * The content layer — the ONLY module tree allowed to import Supabase.
 *
 * Components and pages import from here (`@/lib/content`) and never from
 * `@/lib/supabase/*`. If the backend is ever swapped, this folder is the only
 * thing that changes. See CLAUDE.md.
 */

export { getProfile } from './profile'
export type { Profile, Social } from './profile'

export { getSections, getSectionBySlug, parseSection } from './sections'
export type { Section } from './sections'

export {
  getEntriesBySection,
  getEntriesForSections,
  getEntryBySlug,
  getAllEntrySlugs,
  parseEntry,
} from './entries'
export type { Entry } from './entries'

export { getTags, getTagsByEntry } from './tags'
export type { Tag } from './tags'

export { getMediaByEntry, mediaPublicUrl } from './media'
export type { Media } from './media'

export { getVariants, getVariantBySlug, getVariantEntryIds } from './variants'
export type { Variant } from './variants'

export { getSiteModel } from './site'
export type { SiteModel, SectionWithEntries, EntryWithRelations } from './site'
