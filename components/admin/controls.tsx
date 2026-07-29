'use client'

import { useEffect, type ReactNode } from 'react'

export function Button({
  children,
  variant = 'default',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'default' | 'ghost' | 'danger'
}) {
  const styles = {
    primary: 'border-redline bg-redline text-bond hover:opacity-90',
    default: 'border-ink/30 bg-panel text-ink hover:border-ink/60',
    ghost: 'border-transparent text-slate hover:text-ink',
    danger: 'border-transparent text-slate hover:text-redline',
  }[variant]
  return (
    <button
      className={`lettering inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 text-[11px] transition-colors disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="lettering text-[10px] text-slate">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-[11px] text-slate">{hint}</span> : null}
    </label>
  )
}

const inputBase =
  'w-full rounded-[2px] border border-ink/25 bg-bond px-3 py-2 text-sm text-ink outline-none focus:border-redline'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-24 ${props.className ?? ''}`} />
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function Toggle({
  checked,
  onChange,
  labels = ['Draft', 'Published'],
}: {
  checked: boolean
  onChange: (v: boolean) => void
  labels?: [string, string]
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="lettering inline-flex items-center gap-2 text-[10px]"
    >
      <span
        className={`relative h-4 w-7 rounded-full border transition-colors ${
          checked ? 'border-redline bg-redline' : 'border-ink/30 bg-panel'
        }`}
      >
        <span
          className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-bond transition-all ${
            checked ? 'left-3.5' : 'left-0.5'
          }`}
        />
      </span>
      <span className={checked ? 'text-ink' : 'text-slate'}>
        {checked ? labels[1] : labels[0]}
      </span>
    </button>
  )
}

/** Slide-in editor drawer. Closes on Escape or backdrop click. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-ink/30 bg-bond shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-ink/20 px-5 py-3">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  )
}
