import { dateRange } from '@/lib/format'
import { Chip } from '@/components/site/Chip'
import { FieldValue } from '@/components/site/FieldValue'
import { bodyFields, pickTitle } from './entry-view'
import type { LayoutProps } from './registry'

const META_TYPES = new Set(['text', 'select', 'url'])

/** Vertical timeline with a date rail — for experience, education, anything dated. */
export function Timeline({ section, entries }: LayoutProps) {
  return (
    <ol className="space-y-8">
      {entries.map((entry) => {
        const title = pickTitle(section.field_schema, entry.data)
        const range = dateRange(entry.start_date, entry.end_date)
        const rest = bodyFields(
          section.field_schema,
          entry.data,
          title?.def ? [title.def.key] : [],
        )
        const meta = rest.filter((f) => META_TYPES.has(f.def.type))
        const long = rest.filter((f) => !META_TYPES.has(f.def.type))

        return (
          <li key={entry.id} className="grid gap-1.5 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
            <div className="lettering pt-1 text-xs text-slate">{range || '—'}</div>
            <div className="relative border-l border-ink/20 pl-5">
              <span
                aria-hidden
                className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bond bg-redline"
              />
              {title?.value ? (
                <h3 className="font-display text-lg font-semibold leading-tight">
                  {String(title.value)}
                </h3>
              ) : null}
              {meta.length ? (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate">
                  {meta.map((f, i) => (
                    <span key={f.def.key} className="flex items-center gap-2">
                      {i > 0 ? <span aria-hidden>·</span> : null}
                      <FieldValue def={f.def} value={f.value} />
                    </span>
                  ))}
                </p>
              ) : null}
              {long.length ? (
                <div className="mt-3 space-y-3">
                  {long.map((f) => (
                    <FieldValue key={f.def.key} def={f.def} value={f.value} />
                  ))}
                </div>
              ) : null}
              {entry.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.tags.map((t) => (
                    <Chip key={t.id} label={t.name} kind={t.kind} />
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
