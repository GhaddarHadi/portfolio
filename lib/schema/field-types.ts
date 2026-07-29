/**
 * The single source of truth for what a "field" can be.
 *
 * A section's `field_schema` (JSON in the database) is an array of FieldDef.
 * That same array drives TWO things with no code changes:
 *   1. the public renderer (which value goes where)
 *   2. the admin form, which builds its inputs from these definitions
 *
 * Add a new section type from the dashboard a year from now -> you only ever
 * write JSON shaped like FieldDef[]. No deploy.
 */

export const FIELD_TYPES = [
  'text',
  'textarea',
  'markdown',
  'url',
  'date',
  'number',
  'boolean',
  'string[]',
  'tags',
  'image',
  'select',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export type FieldDef = {
  /** key inside entries.data (or a relation, for `tags` / `image`) */
  key: string
  label: string
  type: FieldType
  required?: boolean
  /** helper text shown under the input in the admin form */
  help?: string
  /** placeholder for text-like inputs */
  placeholder?: string
  /** options for `select` */
  options?: string[]
}

/**
 * `tags` and `image` are NOT stored in entries.data — they live in their own
 * tables (entry_tags, media). The form engine and renderer must treat them as
 * relations, not plain JSON keys. Keeping that fact in one exported helper so
 * every consumer agrees.
 */
export const RELATION_FIELD_TYPES: ReadonlySet<FieldType> = new Set(['tags', 'image'])

export function isRelationField(type: FieldType): boolean {
  return RELATION_FIELD_TYPES.has(type)
}

/** Layouts map 1:1 to renderer components (see components/layouts/registry.ts). */
export const LAYOUTS = [
  'timeline',
  'card_grid',
  'chip_cloud',
  'prose',
  'stat_row',
  'gallery',
] as const

export type Layout = (typeof LAYOUTS)[number]
