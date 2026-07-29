import { isRelationField, type FieldDef } from '@/lib/schema/field-types'

/**
 * Layout components render by field TYPE, not by hardcoded keys — that's what
 * lets a brand-new section (invented in the dashboard) render with no code
 * change. These helpers give each layout a consistent way to pick a title and
 * iterate the remaining body fields.
 */

export type FieldValue = { def: FieldDef; value: unknown }

/** The heading of an entry: the first required text field, else the first text field. */
export function pickTitle(
  fields: FieldDef[],
  data: Record<string, unknown>,
): FieldValue | null {
  const def =
    fields.find((f) => f.type === 'text' && f.required) ??
    fields.find((f) => f.type === 'text')
  if (!def) return null
  return { def, value: data[def.key] }
}

/** Non-relation fields (relations = tags/media, rendered separately), minus excludeKeys. */
export function bodyFields(
  fields: FieldDef[],
  data: Record<string, unknown>,
  excludeKeys: string[] = [],
): FieldValue[] {
  return fields
    .filter((f) => !isRelationField(f.type) && !excludeKeys.includes(f.key))
    .map((f) => ({ def: f, value: data[f.key] }))
    .filter((fv) => fv.value !== undefined && fv.value !== null && fv.value !== '')
}

export function hasValue(v: unknown): boolean {
  if (v == null || v === '') return false
  if (Array.isArray(v)) return v.length > 0
  return true
}

/** First field of a given type, if any (used by card_grid to find tagline/links). */
export function firstOfType(fields: FieldDef[], type: FieldDef['type']): FieldDef | undefined {
  return fields.find((f) => f.type === type)
}
