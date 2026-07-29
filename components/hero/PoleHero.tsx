import type { PoleLabel } from './pole-config'

/**
 * Static schematic of a distribution pole with conductor callouts — the same
 * annotations the WebGL version carries, so the fallback tells the same story.
 * Shown on reduced-motion, low-core and save-data devices, and always painted
 * first so the hero never waits on JavaScript.
 */
export function PoleHero({
  className = 'h-auto w-full',
  labels = [],
}: {
  className?: string
  labels?: PoleLabel[]
}) {
  const byId = (id: string) => labels.find((l) => l.id === id)

  // y positions in SVG space, matched to the callouts
  const rows: { id: string; y: number; side: 'left' | 'right' }[] = [
    { id: 'primary', y: 96, side: 'right' },
    { id: 'neutral', y: 176, side: 'right' },
    { id: 'secondary', y: 214, side: 'left' },
    { id: 'xfmr', y: 268, side: 'right' },
    { id: 'comm', y: 340, side: 'left' },
  ]

  return (
    <svg
      viewBox="0 0 360 460"
      className={className}
      role="img"
      aria-label="Schematic of a distribution pole with conductor callouts"
      fill="none"
    >
      {/* ground */}
      <line x1="120" y1="404" x2="240" y2="404" className="stroke-ink" strokeWidth="1.5" />
      {Array.from({ length: 7 }).map((_, i) => (
        <line
          key={i}
          x1={124 + i * 19}
          y1="404"
          x2={116 + i * 19}
          y2="413"
          className="stroke-slate"
          strokeWidth="1"
        />
      ))}

      {/* pole */}
      <rect x="174" y="70" width="12" height="334" className="fill-panel stroke-ink" strokeWidth="1.5" />

      {/* primary crossarm + 3 phases */}
      <line x1="118" y1="96" x2="242" y2="96" className="stroke-ink" strokeWidth="3" />
      {[124, 180, 236].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="88" r="4" className="fill-bond stroke-blue" strokeWidth="1.5" />
          <line x1={x} y1="88" x2={x} y2="70" className="stroke-ink" strokeWidth="1" />
        </g>
      ))}
      <line x1="60" y1="80" x2="300" y2="80" className="stroke-ink" strokeWidth="1.25" />
      <line x1="60" y1="84" x2="300" y2="84" className="stroke-ink" strokeWidth="1.25" />
      <line x1="60" y1="88" x2="300" y2="88" className="stroke-ink" strokeWidth="1.25" />

      {/* neutral */}
      <line x1="60" y1="176" x2="300" y2="176" className="stroke-ink" strokeWidth="1" />

      {/* secondary triplex */}
      <line x1="60" y1="212" x2="300" y2="212" className="stroke-ink" strokeWidth="1.5" opacity="0.85" />
      <line x1="60" y1="216" x2="300" y2="216" className="stroke-ink" strokeWidth="1.5" opacity="0.85" />

      {/* transformer */}
      <rect x="188" y="250" width="30" height="40" rx="4" className="fill-panel stroke-ink" strokeWidth="1.5" />
      <line x1="188" y1="260" x2="218" y2="260" className="stroke-slate" strokeWidth="1" />

      {/* comm */}
      <line x1="60" y1="340" x2="300" y2="340" className="stroke-slate" strokeWidth="1.5" />
      <line x1="60" y1="356" x2="300" y2="356" className="stroke-amber" strokeWidth="1.5" />
      <rect x="150" y="330" width="22" height="16" className="fill-panel stroke-slate" strokeWidth="1" />

      {/* callouts */}
      {rows.map(({ id, y, side }) => {
        const label = byId(id)
        if (!label) return null
        const anchorX = side === 'right' ? 250 : 110
        const textX = side === 'right' ? 300 : 60
        return (
          <g key={id}>
            <line
              x1={anchorX}
              y1={y}
              x2={side === 'right' ? 292 : 68}
              y2={y}
              className="stroke-slate"
              strokeWidth="0.75"
            />
            <circle cx={anchorX} cy={y} r="1.8" className="fill-slate" />
            <text
              x={textX}
              y={y - 2}
              textAnchor={side === 'right' ? 'end' : 'start'}
              className="fill-ink font-mono"
              fontSize="9"
              letterSpacing="1"
            >
              {label.text.toUpperCase()}
            </text>
            {label.detail ? (
              <text
                x={textX}
                y={y + 9}
                textAnchor={side === 'right' ? 'end' : 'start'}
                className="fill-slate font-mono"
                fontSize="8.5"
              >
                {label.detail}
              </text>
            ) : null}
          </g>
        )
      })}

      <text x="14" y="446" className="fill-slate font-mono" fontSize="8.5" letterSpacing="1">
        TYP. DISTRIBUTION POLE — N.T.S.
      </text>
    </svg>
  )
}
