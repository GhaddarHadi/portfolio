import { techLogo, monogram } from '@/lib/tech-logos'

/**
 * A tech/tool chip styled like a part label on a drawing. Accent by kind.
 * If a logo exists for the name it rides along; if not, the chip is just text —
 * no gaps, no placeholder icons.
 */
export function Chip({ label, kind }: { label: string; kind?: string | null }) {
  const accent =
    kind === 'tool'
      ? 'border-amber/60 text-ink'
      : kind === 'domain'
        ? 'border-blue/70 text-ink'
        : 'border-ink/25 text-ink'
  const logo = techLogo(label)
  const mono = logo ? null : monogram(label)

  return (
    <span
      className={`lettering inline-flex items-center gap-1.5 rounded-[2px] border ${accent} bg-panel px-2 py-1 text-[10px] leading-none`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" aria-hidden loading="lazy" className="h-3 w-3 object-contain" />
      ) : mono ? (
        <span
          aria-hidden
          className="inline-flex h-3 w-3 items-center justify-center rounded-[1px] border border-amber/70 text-[6px] font-semibold tracking-normal text-amber"
        >
          {mono}
        </span>
      ) : null}
      {label}
    </span>
  )
}
