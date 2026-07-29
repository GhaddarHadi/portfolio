'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { PoleHero } from './PoleHero'
import { resolvePoleLabels } from './pole-config'

// Lazy — the WebGL bundle is never part of the initial payload, so it cannot
// affect LCP. ssr:false because three.js has no business rendering on a server.
const PoleScene = dynamic(() => import('./PoleScene'), { ssr: false })

/**
 * Decides whether the hero is the interactive pole or the static schematic:
 *
 *  - prefers-reduced-motion  -> static SVG, always
 *  - fewer than 4 CPU cores  -> static SVG (cheap phones stay fast)
 *  - save-data enabled       -> static SVG
 *  - otherwise               -> mount WebGL shortly after first paint
 *
 * Both versions carry the same conductor callouts, so nothing is lost in the
 * fallback. The SVG renders immediately in every case — there is never an empty
 * box waiting on JavaScript.
 */
export function Hero({ labelOverride }: { labelOverride?: unknown }) {
  const [mode, setMode] = useState<'static' | 'webgl'>('static')
  const labels = resolvePoleLabels(labelOverride)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cores = navigator.hardwareConcurrency ?? 4
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (reduced || cores < 4 || conn?.saveData === true) return

    const timer = window.setTimeout(() => setMode('webgl'), 700)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative aspect-[4/5] w-full">
      {mode === 'webgl' ? (
        // absolute inset-0 so the height comes from the positioned box, which is
        // resolved when the canvas measures itself
        <div className="absolute inset-0">
          <PoleScene labels={labels} />
        </div>
      ) : (
        <PoleHero className="h-full w-full" labels={labels} />
      )}
    </div>
  )
}
