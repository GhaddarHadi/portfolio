'use client'

import { useState } from 'react'

/**
 * Renders the email without a plain-text mailto in the initial HTML, so page
 * scrapers don't harvest it. The full address + mailto only materialize after
 * the user clicks to reveal.
 */
export function ObfuscatedEmail({
  user,
  domain,
  className = '',
}: {
  user: string
  domain: string
  className?: string
}) {
  const [revealed, setRevealed] = useState(false)
  const email = `${user}@${domain}`

  if (revealed) {
    return (
      <a href={`mailto:${email}`} className={className}>
        {email}
      </a>
    )
  }
  return (
    <button type="button" onClick={() => setRevealed(true)} className={className}>
      {user}&nbsp;[at]&nbsp;{domain}
    </button>
  )
}
