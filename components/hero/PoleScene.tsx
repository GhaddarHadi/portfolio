'use client'

import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { type PoleLabel } from './pole-config'

/**
 * A distribution pole, drawn the way a plan sheet annotates one: the equipment
 * modelled honestly, and leader lines calling out what each conductor is.
 *
 * Labels are HTML/SVG overlaid on the canvas and re-projected from their 3D
 * anchors every frame, so they stay attached as the pole moves. Motion is a
 * slow oscillation rather than a full spin — enough to read as 3D, not so much
 * that the callouts swing around and become unreadable.
 */

// The pole sits on the dark hero panel, so conductors and hardware are drawn in
// light tones — a near-black conductor would simply vanish against it.
const INK = '#c6ced8'
const BLUE = '#8fb4d4'
const AMBER = '#e0a32e'
const SLATE = '#8892a0'
const WOOD = '#9a8264'
const METAL = '#aab2bb'

const GROUND = -2.2
const TOP = 3.2
const SPAN = 3.0 // conductors run this far each way along Z
// The pole spans GROUND..TOP, so its midpoint is above the origin. Shift the
// whole assembly down by that much and the default camera target frames it.
const CENTER_Y = (TOP + GROUND) / 2

function Conductor({
  y,
  x = 0,
  color = INK,
  radius = 0.022,
}: {
  y: number
  x?: number
  color?: string
  radius?: number
}) {
  return (
    <mesh position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, SPAN * 2, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

function PoleBody() {
  return (
    <>
      {/* shaft — tapered, like a real wood pole */}
      <mesh position={[0, (TOP + GROUND) / 2, 0]}>
        <cylinderGeometry args={[0.085, 0.125, TOP - GROUND, 20]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>

      {/* primary crossarm */}
      <mesh position={[0, 2.72, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.12]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>

      {/* insulators under each primary phase */}
      {[-0.85, 0, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 2.63, 0]}>
          <cylinderGeometry args={[0.055, 0.07, 0.16, 10]} />
          <meshStandardMaterial color={BLUE} roughness={0.35} />
        </mesh>
      ))}

      {/* transformer */}
      <mesh position={[0.34, 0.34, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.62, 18]} />
        <meshStandardMaterial color={METAL} roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0.34, 0.68, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 12]} />
        <meshStandardMaterial color={METAL} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* comm equipment box */}
      <mesh position={[-0.22, -0.62, 0]}>
        <boxGeometry args={[0.3, 0.22, 0.2]} />
        <meshStandardMaterial color={SLATE} roughness={0.7} />
      </mesh>
    </>
  )
}

function Ground() {
  const pts = useMemo(() => {
    const g: THREE.Vector3[] = []
    for (let i = -5; i <= 5; i++) {
      g.push(new THREE.Vector3(-0.55, GROUND, i * 0.9), new THREE.Vector3(0.55, GROUND, i * 0.9))
    }
    return g
  }, [])
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])
  return (
    <>
      <mesh position={[0, GROUND, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 10]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.08} />
      </mesh>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={SLATE} transparent opacity={0.4} />
      </lineSegments>
    </>
  )
}

/**
 * Projects each label's 3D anchor to screen space each frame and writes the
 * result straight to the DOM — no React state, so no re-render per frame.
 */
function Projector({
  labels,
  group,
  overlay,
}: {
  labels: PoleLabel[]
  group: React.RefObject<THREE.Group | null>
  overlay: React.RefObject<HTMLDivElement | null>
}) {
  const { camera, size } = useThree()
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const root = overlay.current
    const g = group.current
    if (!root || !g) return

    for (const label of labels) {
      const el = root.querySelector<HTMLElement>(`[data-label="${label.id}"]`)
      const line = root.querySelector<SVGLineElement>(`[data-leader="${label.id}"]`)
      if (!el) continue

      v.set(label.x, label.y, 0).applyMatrix4(g.matrixWorld).project(camera)
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height

      // label parks at a fixed margin; the leader stretches to the anchor
      const labelX = label.side === 'right' ? size.width - 8 : 8
      el.style.transform = `translate(${label.side === 'right' ? '-100%' : '0'}, -50%)`
      el.style.left = `${labelX}px`
      el.style.top = `${y}px`

      if (line) {
        line.setAttribute('x1', String(x))
        line.setAttribute('y1', String(y))
        line.setAttribute('x2', String(label.side === 'right' ? labelX - el.offsetWidth - 6 : labelX + el.offsetWidth + 6))
        line.setAttribute('y2', String(y))
      }
    }
  })
  return null
}

/** Shared between the DOM drag handlers and the render loop. */
export type DragState = { angle: number; dragging: boolean; touched: boolean }

function Rig({
  labels,
  overlay,
  drag,
}: {
  labels: PoleLabel[]
  overlay: React.RefObject<HTMLDivElement | null>
  drag: React.RefObject<DragState>
}) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current || !drag.current) return
    const d = drag.current

    if (!d.touched) {
      // until the visitor grabs it, drift gently so it reads as 3D
      d.angle = Math.sin(state.clock.elapsedTime * 0.22) * 0.24
    }
    // ease toward the target angle — dragging feels weighted, not twitchy
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, d.angle, 0.18)
  })

  return (
    <>
      <group ref={ref} position={[0, -CENTER_Y, 0]}>
        <PoleBody />
        {/* primary phases */}
        <Conductor y={2.78} x={-0.85} />
        <Conductor y={2.78} x={0} />
        <Conductor y={2.78} x={0.85} />
        {/* neutral */}
        <Conductor y={1.78} x={0.16} radius={0.018} />
        {/* secondary triplex — three bundled */}
        <Conductor y={1.22} x={-0.16} radius={0.017} color="#7f8894" />
        <Conductor y={1.18} x={-0.19} radius={0.017} color="#7f8894" />
        <Conductor y={1.2} x={-0.13} radius={0.017} color="#7f8894" />
        {/* comm */}
        <Conductor y={-0.62} x={-0.16} radius={0.02} color={SLATE} />
        <Conductor y={-0.86} x={-0.16} radius={0.02} color={AMBER} />
        <Ground />
      </group>
      <Projector labels={labels} group={ref} overlay={overlay} />
    </>
  )
}

const DRAG_SENSITIVITY = 0.011 // radians per pixel
const KEY_STEP = 0.25

export default function PoleScene({ labels }: { labels: PoleLabel[] }) {
  const overlay = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState>({ angle: 0, dragging: false, touched: false })
  const lastX = useRef(0)
  const [grabbing, setGrabbing] = useState(false)

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current.dragging = true
    drag.current.touched = true
    lastX.current = e.clientX
    setGrabbing(true)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.dragging) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    drag.current.angle += dx * DRAG_SENSITIVITY
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    drag.current.dragging = false
    setGrabbing(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    drag.current.touched = true
    drag.current.angle += e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP
  }

  return (
    <div
      className={`relative h-full w-full ${grabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      // pan-y keeps vertical page scrolling working on touch devices while we
      // take over horizontal movement for rotation
      style={{ touchAction: 'pan-y' }}
      tabIndex={0}
      role="img"
      aria-label="Interactive 3D distribution pole. Drag left or right, or use the arrow keys, to rotate."
    >
      <Canvas
        // Framed to fit the full pole with margin: at this distance and fov the
        // visible height is ~6.9 units against a 5.4-unit pole, so ground line
        // and crossarm both stay comfortably inside the frame.
        camera={{ position: [6.0, 0.9, 11.5], fov: 30 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        resize={{ offsetSize: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 7, 4]} intensity={1.1} />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} color={BLUE} />
        <Rig labels={labels} overlay={overlay} drag={drag} />
      </Canvas>

      {/* annotation overlay — leader lines + callouts */}
      <div ref={overlay} className="pointer-events-none absolute inset-0">
        <span className="lettering absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-slate">
          Drag to rotate
        </span>
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {labels.map((l) => (
            <line
              key={l.id}
              data-leader={l.id}
              stroke="currentColor"
              strokeWidth="1"
              className="text-slate"
              opacity="0.7"
            />
          ))}
        </svg>
        {labels.map((l) => (
          <div
            key={l.id}
            data-label={l.id}
            className="absolute whitespace-nowrap"
            style={{ left: 0, top: 0 }}
          >
            <div className="lettering text-[9px] leading-tight text-ink">{l.text}</div>
            {l.detail ? (
              <div className="font-mono text-[9px] leading-tight text-slate">{l.detail}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
