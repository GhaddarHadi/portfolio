/**
 * Callouts on the pole hero.
 *
 * Defaults live here, but `profile.theme.hero_labels` overrides them, so the
 * annotations stay editable as data rather than requiring a code change.
 * `y` is the world height of the thing being pointed at; `side` picks which
 * way the leader line runs.
 */
export type PoleLabel = {
  id: string
  text: string
  detail?: string
  y: number
  x: number
  side: 'left' | 'right'
}

export const DEFAULT_POLE_LABELS: PoleLabel[] = [
  { id: 'primary', text: 'Primary', detail: '#4 ACSR — 3∅', y: 2.72, x: 0.95, side: 'right' },
  { id: 'neutral', text: 'Neutral', detail: '#4 ACSR', y: 1.78, x: 0.16, side: 'right' },
  { id: 'secondary', text: 'Secondary', detail: '3/0 Triplex', y: 1.2, x: -0.16, side: 'left' },
  { id: 'xfmr', text: 'Transformer', detail: 'Pole-mount', y: 0.34, x: 0.34, side: 'right' },
  { id: 'comm', text: 'Comm', detail: 'CATV / Telco', y: -0.62, x: -0.16, side: 'left' },
]

/** Merge DB overrides (by id) onto the defaults. */
export function resolvePoleLabels(override: unknown): PoleLabel[] {
  if (!Array.isArray(override)) return DEFAULT_POLE_LABELS
  return DEFAULT_POLE_LABELS.map((base) => {
    const found = (override as Partial<PoleLabel>[]).find((o) => o?.id === base.id)
    return found ? { ...base, ...found } : base
  })
}
