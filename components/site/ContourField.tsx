/**
 * The flowing line field from Hadi's reference image, rebuilt in this site's
 * palette: a deep ink ground with two dense concentric swirls — a broad sweeping
 * one at the left and a tight vortex at the right — drawn in non-photo blue
 * with an amber core, instead of the original's purple.
 *
 * Recoloured they stop reading as sci-fi waves and read as contour lines, which
 * is true to the GIS side of Hadi's work.
 *
 * Paths are computed deterministically at module scope: identical output on the
 * server and the client (no hydration mismatch) and no per-render cost.
 */

type Cluster = {
  cx: number
  cy: number
  rings: number
  r0: number
  step: number
  squash: number
  rot: number
  lobes: number
  amp: number
  phase: number
  drift: number
  /** 0 = cool blue, 1 = warm amber core */
  warm: number
}

/**
 * Both clusters are pushed into opposite corners and kept open and faint.
 *
 * The first version put a tight, bright vortex at centre-right — directly
 * behind the pole, so the densest pattern sat under the busiest content and the
 * leader lines had to fight it. Backgrounds should be quietest exactly where
 * content lives, so these now frame the hero from the corners instead: fewer
 * rings, wider spacing (less moiré shimmer) and far lower opacity.
 */
const CLUSTERS: Cluster[] = [
  // low sweep, bottom-left — behind the margin, not the headline
  {
    cx: 150, cy: 880, rings: 22, r0: 60, step: 30, squash: 0.72,
    rot: -0.55, lobes: 3, amp: 0.26, phase: 0.5, drift: 0.035, warm: 0,
  },
  // open spiral, top-right corner — above and outboard of the pole
  {
    cx: 1880, cy: 120, rings: 24, r0: 44, step: 27, squash: 0.62,
    rot: 0.8, lobes: 2, amp: 0.3, phase: 2.2, drift: 0.045, warm: 1,
  },
]

function ringPath(c: Cluster, i: number): string {
  const r = c.r0 + i * c.step
  const steps = 88
  const cos = Math.cos(c.rot)
  const sin = Math.sin(c.rot)
  // each successive ring twists slightly — this is what creates the woven,
  // moiré quality of the reference rather than flat nested ovals
  const twist = i * c.drift
  let d = ''
  for (let s = 0; s <= steps; s++) {
    const t = (s / steps) * Math.PI * 2
    const rx = r * (1 + c.amp * Math.sin(c.lobes * t + c.phase + twist))
    const ry = r * c.squash * (1 + c.amp * 0.62 * Math.cos((c.lobes - 1) * t + c.phase + twist))
    const px = rx * Math.cos(t)
    const py = ry * Math.sin(t)
    const x = c.cx + px * cos - py * sin
    const y = c.cy + px * sin + py * cos
    d += `${s === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d + 'Z'
}

const PATHS = CLUSTERS.flatMap((c, ci) =>
  Array.from({ length: c.rings }, (_, i) => {
    const t = i / c.rings
    return {
      key: `${ci}-${i}`,
      d: ringPath(c, i),
      warm: c.warm,
      // deliberately faint: texture at the edge of perception, never a subject
      opacity: Number((0.3 * Math.pow(1 - t, 1.2) + 0.05).toFixed(3)),
    }
  }),
)

export function ContourField({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 2000 1060"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id="cf-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fb4d4" />
          <stop offset="100%" stopColor="#5b6572" />
        </linearGradient>
        {/* a hint of warmth in the corner, not a focal point */}
        <linearGradient id="cf-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fb4d4" />
          <stop offset="70%" stopColor="#a9a08a" />
          <stop offset="100%" stopColor="#c08f35" />
        </linearGradient>
      </defs>
      <g fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
        {PATHS.map((p) => (
          <path
            key={p.key}
            d={p.d}
            stroke={p.warm ? 'url(#cf-warm)' : 'url(#cf-cool)'}
            opacity={p.opacity}
          />
        ))}
      </g>
    </svg>
  )
}
