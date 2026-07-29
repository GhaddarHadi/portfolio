import { firstOfType, pickTitle } from './entry-view'
import type { LayoutProps } from './registry'

/**
 * A row of stat cells styled like dimension callouts: big value + small label.
 * Value = first number field if present, else the entry title.
 */
export function StatRow({ section, entries }: LayoutProps) {
  const numberDef = firstOfType(section.field_schema, 'number')
  const titleDef = pickTitle(section.field_schema, {})?.def
  const labelDef = section.field_schema.find((f) => f.type === 'text' && f.key !== titleDef?.key)

  return (
    <dl className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
      {entries.map((entry) => {
        const value = numberDef
          ? String(entry.data[numberDef.key] ?? '')
          : titleDef
            ? String(entry.data[titleDef.key] ?? '')
            : ''
        const label = labelDef
          ? String(entry.data[labelDef.key] ?? '')
          : titleDef
            ? String(entry.data[titleDef.key] ?? '')
            : ''
        return (
          <div key={entry.id} className="bg-bond px-4 py-5">
            <dd className="font-display text-2xl font-bold tabular-nums sm:text-3xl">{value}</dd>
            <dt className="lettering mt-1 text-[10px] text-slate">{label}</dt>
          </div>
        )
      })}
    </dl>
  )
}
