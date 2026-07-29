/** L-shaped registration marks at the four corners of the sheet. */
export function CornerTicks() {
  const base = 'pointer-events-none absolute h-3 w-3 border-ink/70'
  return (
    <div aria-hidden>
      <span className={`${base} left-0 top-0 border-l border-t`} />
      <span className={`${base} right-0 top-0 border-r border-t`} />
      <span className={`${base} bottom-0 left-0 border-b border-l`} />
      <span className={`${base} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}
