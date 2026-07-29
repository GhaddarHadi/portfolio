'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Chip } from '@/components/site/Chip'
import { firstOfType, pickTitle } from './entry-view'
import type { LayoutProps } from './registry'

/**
 * Singular form of the section title, used to label each card.
 * "Projects" -> "PROJECT 01". Derived rather than hardcoded, so renaming the
 * section in /admin renames the cards too.
 */
function itemLabel(sectionTitle: string): string {
  const t = sectionTitle.trim()
  if (/ies$/i.test(t)) return t.slice(0, -3) + 'y' // Case studies -> Case study
  if (/(ches|shes|sses|xes)$/i.test(t)) return t.slice(0, -2)
  if (/s$/i.test(t) && !/ss$/i.test(t)) return t.slice(0, -1)
  return t
}

/** Project grid with client-side tag filtering. Each card reads like a detail callout. */
export function CardGrid({ section, entries }: LayoutProps) {
  const [active, setActive] = useState<string | null>(null)
  const label = itemLabel(section.title)

  const allTags = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const e of entries) for (const t of e.tags) if (!map.has(t.name)) map.set(t.name, t.kind)
    return [...map.entries()].map(([name, kind]) => ({ name, kind }))
  }, [entries])

  const shown = active
    ? entries.filter((e) => e.tags.some((t) => t.name === active))
    : entries

  const titleDef = pickTitle(section.field_schema, {})?.def
  const taglineDef = section.field_schema.find(
    (f) => f.type === 'text' && f.key !== titleDef?.key,
  )
  const numberDef = firstOfType(section.field_schema, 'number')

  return (
    <div>
      {allTags.length ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="lettering mr-1 text-[10px] text-slate">Filter</span>
          <FilterChip label="All" active={active === null} onClick={() => setActive(null)} />
          {allTags.map((t) => (
            <FilterChip
              key={t.name}
              label={t.name}
              active={active === t.name}
              onClick={() => setActive(active === t.name ? null : t.name)}
            />
          ))}
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((entry, i) => {
          const name = titleDef ? String(entry.data[titleDef.key] ?? '') : ''
          const tagline = taglineDef ? String(entry.data[taglineDef.key] ?? '') : ''
          const num = numberDef ? String(entry.data[numberDef.key] ?? '') : String(i + 1).padStart(2, '0')
          const cover = entry.media[0]
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="lettering text-[10px] text-slate">{`${label} ${num}`}</span>
                {entry.slug ? (
                  <span className="lettering text-[10px] text-redline opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                ) : null}
              </div>
              {cover ? (
                <div className="mt-3 overflow-hidden border border-ink/10 bg-ink/[0.03]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.url}
                    alt={cover.alt ?? ''}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
              ) : null}
              <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{name}</h3>
              {tagline ? <p className="mt-1 text-sm text-slate">{tagline}</p> : null}
              {entry.tags.length ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {entry.tags.map((t) => (
                    <Chip key={t.id} label={t.name} kind={t.kind} />
                  ))}
                </div>
              ) : null}
            </>
          )
          return (
            <li key={entry.id}>
              {entry.slug ? (
                <Link
                  href={`/work/${entry.slug}`}
                  className="group block h-full border border-ink/20 bg-panel p-5 transition-colors hover:border-redline"
                >
                  {inner}
                </Link>
              ) : (
                <div className="h-full border border-ink/20 bg-panel p-5">{inner}</div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`lettering rounded-[2px] border px-2 py-1 text-[10px] leading-none transition-colors ${
        active
          ? 'border-redline bg-redline text-bond'
          : 'border-ink/25 bg-panel text-slate hover:border-ink/50'
      }`}
    >
      {label}
    </button>
  )
}
