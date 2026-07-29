/**
 * Section header: a numbered rule.
 *
 * The number sits on its own fixed-width column and is baseline-aligned to the
 * title's cap height, so 01 / 02 / 03 line up in a true left column down the
 * page instead of drifting with each title's length.
 */
export function SectionHeader({
  index,
  title,
  subtitle,
  layout,
}: {
  index: number
  title: string
  subtitle?: string | null
  layout: string
}) {
  const num = String(index).padStart(2, '0')
  return (
    <header className="mb-7">
      <div className="grid grid-cols-[2.25rem_1fr] items-baseline gap-x-3 border-b border-ink/25 pb-2">
        <span className="lettering text-xs leading-none text-redline">{num}</span>
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl font-bold uppercase leading-none tracking-wide sm:text-2xl">
            {title}
          </h2>
          <span aria-hidden className="hidden h-px flex-1 self-center bg-ink/15 sm:block" />
          <span className="lettering ml-auto text-[10px] leading-none text-slate sm:ml-0">
            {layout.replace('_', ' ')}
          </span>
        </div>
      </div>
      {subtitle ? <p className="ml-[3.25rem] mt-2 text-sm text-slate">{subtitle}</p> : null}
    </header>
  )
}
