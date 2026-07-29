'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Section } from '@/lib/content'
import { FIELD_TYPES, LAYOUTS, type FieldDef } from '@/lib/schema/field-types'
import { saveSection } from '@/app/admin/actions'
import { Drawer, Field, TextInput, TextArea, SelectInput, Toggle, Button } from './controls'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Create / edit a section — including its field_schema, which drives everything. */
export function SectionEditor({
  open,
  onClose,
  section,
}: {
  open: boolean
  onClose: () => void
  section: Section | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState(section?.title ?? '')
  const [slug, setSlug] = useState(section?.slug ?? '')
  const [subtitle, setSubtitle] = useState(section?.subtitle ?? '')
  const [layout, setLayout] = useState(section?.layout ?? 'timeline')
  const [visible, setVisible] = useState(section?.visible ?? true)
  const [fields, setFields] = useState<FieldDef[]>(section?.field_schema ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(i: number, patch: Partial<FieldDef>) {
    setFields((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  }

  async function onSave() {
    setSaving(true)
    setError('')
    const res = await saveSection({
      id: section?.id,
      title,
      slug: slug || slugify(title),
      subtitle: subtitle || null,
      layout,
      field_schema: fields,
      visible,
    })
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <Drawer open={open} onClose={onClose} title={section ? 'Edit section' : 'New section'}>
      <div className="space-y-4">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!section && !slug) setSlug(slugify(e.target.value))
            }}
            placeholder="Speaking"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Slug">
            <TextInput value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="speaking" />
          </Field>
          <Field label="Layout">
            <SelectInput value={layout} onChange={(e) => setLayout(e.target.value as typeof layout)}>
              {LAYOUTS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Subtitle" hint="Optional">
          <TextInput value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>

        <div className="border-t border-ink/15 pt-4">
          <div className="lettering mb-2 flex items-center justify-between text-[10px] text-slate">
            <span>Fields</span>
            <Button
              type="button"
              onClick={() =>
                setFields((f) => [...f, { key: '', label: '', type: 'text' } as FieldDef])
              }
            >
              + Add field
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={i} className="space-y-2 border border-ink/15 bg-panel p-3">
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    placeholder="Label"
                    value={f.label}
                    onChange={(e) => {
                      const label = e.target.value
                      updateField(i, { label, key: f.key || slugify(label).replace(/-/g, '_') })
                    }}
                  />
                  <TextInput
                    placeholder="key"
                    value={f.key}
                    onChange={(e) => updateField(i, { key: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <SelectInput
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value as FieldDef['type'] })}
                    className="flex-1"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </SelectInput>
                  <label className="lettering flex items-center gap-1.5 text-[10px] text-slate">
                    <input
                      type="checkbox"
                      checked={f.required ?? false}
                      onChange={(e) => updateField(i, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  <Button
                    variant="danger"
                    onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                </div>
                {f.type === 'select' ? (
                  <TextInput
                    placeholder="Options, comma separated"
                    value={(f.options ?? []).join(', ')}
                    onChange={(e) =>
                      updateField(i, {
                        options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                ) : null}
              </div>
            ))}
            {fields.length === 0 ? (
              <p className="text-[11px] text-slate">No fields yet. Add one to shape this section.</p>
            ) : null}
          </div>
        </div>

        {error ? <p className="text-[12px] text-redline">{error}</p> : null}

        <div className="flex items-center justify-between border-t border-ink/15 pt-4">
          <Toggle checked={visible} onChange={setVisible} labels={['Hidden', 'Visible']} />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save section'}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
