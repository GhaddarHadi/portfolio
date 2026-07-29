'use client'

/**
 * Shows the real address — with a proper "@" — while keeping it away from the
 * address harvesters that crawl portfolio sites.
 *
 * The characters live in the HTML **reversed** ("moc.liamg@raddahgmidah") and
 * CSS flips them back visually. A person reads hadimghaddar@gmail.com; a
 * scraper reading the source sees nonsense. The `mailto:` is assembled in
 * JavaScript at click time, so it never appears in the markup either.
 *
 * IMPORTANT: this component takes the ALREADY-REVERSED string, not the address
 * or its parts. React serialises client-component props into the page, so
 * passing `user` and `domain` separately would put "hadimghaddar" and
 * "gmail.com" in the HTML for anything to rejoin — which defeats the whole
 * exercise. Keep the plain address out of the props.
 *
 * Trade-off: selecting the text and copying it by hand yields the reversed
 * string. Clicking is the normal path — it opens the mail client and also
 * copies the correct address to the clipboard.
 */
export function ObfuscatedEmail({
  reversed,
  className = '',
}: {
  reversed: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const address = [...reversed].reverse().join('')
        navigator.clipboard?.writeText(address).catch(() => {})
        window.location.href = `mailto:${address}`
      }}
      className={className}
      aria-label="Email me — opens your mail app and copies the address"
      title="Click to email"
    >
      <span aria-hidden style={{ unicodeBidi: 'bidi-override', direction: 'rtl' }}>
        {reversed}
      </span>
    </button>
  )
}
