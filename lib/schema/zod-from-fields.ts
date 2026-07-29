import { z } from 'zod'
import { isRelationField, type FieldDef } from './field-types'

/**
 * Build a Zod validator at RUNTIME from a section's field_schema.
 *
 * This is what makes the system "typed end to end" even though sections are
 * data: whatever fields you invent in the dashboard, the admin form validates
 * the payload against a schema derived from those same fields before writing.
 *
 * `tags` and `image` are skipped here — they are relations (entry_tags / media),
 * not keys inside entries.data, so they are validated on their own path.
 */

function baseZodForField(f: FieldDef): z.ZodTypeAny {
  switch (f.type) {
    case 'text':
    case 'textarea':
    case 'markdown':
      return z.string()
    case 'url':
      return z.url('Must be a valid URL')
    case 'date':
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    case 'number':
      return z.coerce.number()
    case 'boolean':
      return z.coerce.boolean()
    case 'string[]':
      return z.array(z.string())
    case 'select':
      return f.options && f.options.length > 0
        ? z.enum(f.options as [string, ...string[]])
        : z.string()
    default:
      return z.string()
  }
}

/** Zod object for the `data` jsonb payload of one entry in this section. */
export function buildEntryDataSchema(fields: FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) {
    if (isRelationField(f.type)) continue // tags/image handled via relations
    const base = baseZodForField(f)
    shape[f.key] = f.required ? base : base.optional()
  }
  // catchall(unknown): keep unknown keys so an older entry isn't destroyed when
  // the section's field_schema gains a field. (Zod v4-safe equivalent of the
  // old .passthrough().)
  return z.object(shape).catchall(z.unknown())
}

export type EntryData = Record<string, unknown>
