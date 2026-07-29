import { Chip } from '@/components/site/Chip'
import { bodyFields, firstOfType, pickTitle } from './entry-view'
import type { LayoutProps } from './registry'

/**
 * Two shapes, chosen from the field types present:
 *
 *  - a `string[]` field  -> grouped chips (skills: group + items)
 *  - otherwise           -> credential cards (certifications: logo, name,
 *                           issuer, and any remaining fields such as a
 *                           credential ID)
 *
 * The card branch is generic: it takes the title from the first text field and
 * renders whatever other fields the section defines, so adding a field in
 * /admin shows up here without a code change.
 */
export function ChipCloud({ section, entries }: LayoutProps) {
  const listDef = firstOfType(section.field_schema, 'string[]')

  if (listDef) {
    const labelDef = firstOfType(section.field_schema, 'text')
    return (
      <div className="space-y-5">
        {entries.map((entry) => {
          const label = labelDef ? String(entry.data[labelDef.key] ?? '') : ''
          const items = (entry.data[listDef.key] as string[] | undefined) ?? []
          return (
            <div key={entry.id} className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <div className="lettering pt-1 text-xs text-slate">{label}</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item, i) => (
                  <Chip key={i} label={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const titleDef = pickTitle(section.field_schema, {})?.def
  const issuerDef = section.field_schema.find((f) => f.type === 'text' && f.key !== titleDef?.key)

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => {
        const name = titleDef ? String(entry.data[titleDef.key] ?? '') : ''
        const issuer = issuerDef ? String(entry.data[issuerDef.key] ?? '') : ''
        const logo = entry.media[0]
        // everything the section defines beyond name + issuer (e.g. credential ID)
        const extras = bodyFields(
          section.field_schema,
          entry.data,
          [titleDef?.key, issuerDef?.key].filter((k): k is string => Boolean(k)),
        )

        return (
          <li
            key={entry.id}
            className="flex gap-3 border border-ink/20 bg-panel p-3"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] bg-white/90 ring-1 ring-ink/10"
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.url} alt="" className="h-5 w-5 object-contain" loading="lazy" />
              ) : (
                <span className="lettering text-[10px] text-slate">{initials(issuer || name)}</span>
              )}
            </span>

            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold leading-snug">{name}</h3>
              {issuer ? <p className="mt-0.5 text-[12px] text-slate">{issuer}</p> : null}
              {extras.map((f) => (
                <p key={f.def.key} className="mt-1 break-all font-mono text-[10px] text-slate">
                  <span className="lettering">{f.def.label}</span> {String(f.value)}
                </p>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Fallback tile content when an issuer has no logo. */
function initials(source: string): string {
  const words = source.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '—'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
