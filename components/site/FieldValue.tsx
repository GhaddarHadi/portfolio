import type { FieldDef } from '@/lib/schema/field-types'
import { monthYear } from '@/lib/format'
import { Markdown } from './Markdown'

/** Renders one field value according to its type. Shared by the layouts. */
export function FieldValue({ def, value }: { def: FieldDef; value: unknown }) {
  if (value == null || value === '') return null

  switch (def.type) {
    case 'string[]':
      return (
        <ul className="space-y-1.5">
          {(value as string[]).map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/85">
              <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-redline" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'markdown':
      return <Markdown>{String(value)}</Markdown>
    case 'textarea':
      return (
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink/85">
          {String(value)}
        </p>
      )
    case 'url': {
      const href = String(value)
      let label = href
      try {
        label = new URL(href).hostname.replace('www.', '')
      } catch {
        /* not a full URL — show as-is */
      }
      return (
        <a
          href={href}
          className="lettering text-xs text-redline underline underline-offset-2"
          target="_blank"
          rel="noreferrer"
        >
          {label}
        </a>
      )
    }
    case 'date':
      return (
        <time dateTime={String(value)} className="font-mono text-sm text-slate">
          {monthYear(String(value))}
        </time>
      )
    case 'number':
      return <span className="font-mono text-sm">{String(value)}</span>
    case 'boolean':
      return value ? <span className="lettering text-xs text-slate">{def.label}</span> : null
    default:
      return <span className="text-[15px] text-ink/85">{String(value)}</span>
  }
}
