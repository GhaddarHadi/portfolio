import { FieldValue } from '@/components/site/FieldValue'
import { bodyFields, pickTitle } from './entry-view'
import type { LayoutProps } from './registry'

/** Long-form blocks — renders each entry's fields top to bottom. */
export function Prose({ section, entries }: LayoutProps) {
  return (
    <div className="max-w-2xl space-y-8">
      {entries.map((entry) => {
        const title = pickTitle(section.field_schema, entry.data)
        const rest = bodyFields(
          section.field_schema,
          entry.data,
          title?.def ? [title.def.key] : [],
        )
        return (
          <article key={entry.id} className="space-y-3">
            {title?.value ? (
              <h3 className="font-display text-lg font-semibold">{String(title.value)}</h3>
            ) : null}
            {rest.map((f) => (
              <FieldValue key={f.def.key} def={f.def} value={f.value} />
            ))}
          </article>
        )
      })}
    </div>
  )
}
