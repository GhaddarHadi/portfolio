'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export type CommandItem = {
  label: string
  hint?: string
  /** in-page anchor (#slug) or a route (/work/…) */
  href: string
  group: string
}

/**
 * ⌘K / Ctrl-K palette. Its contents come from the same database-driven
 * sections and entries the page renders — nothing is hardcoded.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // focus after the dialog paints
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q),
    )
  }, [items, query])

  function go(item: CommandItem) {
    setOpen(false)
    if (item.href.startsWith('#')) {
      document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push(item.href)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lettering fixed bottom-4 right-4 z-40 hidden rounded-[2px] border border-ink/30 bg-panel px-3 py-2 text-[10px] text-slate backdrop-blur transition-colors hover:border-redline hover:text-ink sm:block"
        aria-label="Open command palette"
      >
        ⌘K — Jump to
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to"
        className="relative w-[min(34rem,92vw)] border border-ink/40 bg-bond shadow-xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault()
              go(results[active])
            }
          }}
          placeholder="Jump to a section or project…"
          className="w-full border-b border-ink/20 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate"
        />
        <ul className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-[13px] text-slate">
              Nothing matches that. Try a section name.
            </li>
          ) : (
            results.map((item, i) => (
              <li key={`${item.href}-${item.label}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                    i === active ? 'bg-redline text-bond' : 'text-ink'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`lettering text-[9px] ${
                      i === active ? 'text-bond/80' : 'text-slate'
                    }`}
                  >
                    {item.hint ?? item.group}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
