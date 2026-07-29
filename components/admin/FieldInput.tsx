'use client'

import { useState } from 'react'
import type { FieldDef } from '@/lib/schema/field-types'
import { Field, TextInput, TextArea, SelectInput, Toggle, Button } from './controls'

/**
 * Renders one input for one field definition. This is the heart of the
 * "self-generating form": the admin never hardcodes inputs — it maps each
 * FieldDef to the right control by type. Invent a field in the section builder
 * and its input appears here automatically.
 */
export function FieldInput({
  def,
  value,
  onChange,
}: {
  def: FieldDef
  value: unknown
  onChange: (v: unknown) => void
}) {
  const common = { label: def.label, hint: def.help }

  switch (def.type) {
    case 'textarea':
    case 'markdown':
      return (
        <Field {...common} hint={def.help ?? (def.type === 'markdown' ? 'Markdown supported' : undefined)}>
          <TextArea
            value={(value as string) ?? ''}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )
    case 'number':
      return (
        <Field {...common}>
          <TextInput
            type="number"
            value={(value as number | string) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </Field>
      )
    case 'boolean':
      return (
        <Field {...common}>
          <Toggle checked={Boolean(value)} onChange={onChange} labels={['Off', 'On']} />
        </Field>
      )
    case 'select':
      return (
        <Field {...common}>
          <SelectInput value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {(def.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </SelectInput>
        </Field>
      )
    case 'string[]':
      return <StringListInput {...common} value={(value as string[]) ?? []} onChange={onChange} />
    case 'tags':
      return <TagsInput {...common} value={(value as string[]) ?? []} onChange={onChange} />
    case 'image':
      return (
        <Field {...common}>
          <p className="rounded-[2px] border border-dashed border-ink/25 bg-panel px-3 py-2 text-[11px] text-slate">
            Save the entry first, then upload images in the Images panel below.
          </p>
        </Field>
      )
    case 'date':
      return (
        <Field {...common}>
          <TextInput
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )
    default:
      return (
        <Field {...common}>
          <TextInput
            type={def.type === 'url' ? 'url' : 'text'}
            value={(value as string) ?? ''}
            placeholder={def.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )
  }
}

function StringListInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <TextInput
              value={item}
              onChange={(e) => {
                const next = [...value]
                next[i] = e.target.value
                onChange(next)
              }}
            />
            <Button
              type="button"
              variant="danger"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button type="button" onClick={() => onChange([...value, ''])}>
          + Add
        </Button>
      </div>
    </Field>
  )
}

function TagsInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const parts = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length) onChange([...new Set([...value, ...parts])])
    setDraft('')
  }
  return (
    <Field label={label} hint={hint ?? 'Enter or comma to add'}>
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t}
            className="lettering inline-flex items-center gap-1 rounded-[2px] border border-ink/25 bg-panel px-2 py-1 text-[10px]"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              className="text-slate hover:text-redline"
              aria-label={`Remove ${t}`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2">
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          placeholder="Add tag…"
        />
      </div>
    </Field>
  )
}
