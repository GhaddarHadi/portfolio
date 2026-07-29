'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Section, Entry, Media } from '@/lib/content'
import { isRelationField } from '@/lib/schema/field-types'
import { saveEntry } from '@/app/admin/actions'
import { Drawer, Field, TextInput, Toggle, Button } from './controls'
import { FieldInput } from './FieldInput'
import { MediaManager } from './MediaManager'

export type EntryDraft = {
  entry: Entry | null
  tags: string[]
  media: Media[]
}

/** The self-generating entry editor. Its inputs come entirely from field_schema. */
export function EntryDrawer({
  open,
  onClose,
  section,
  draft,
}: {
  open: boolean
  onClose: () => void
  section: Section
  draft: EntryDraft | null
}) {
  const router = useRouter()
  const entry = draft?.entry ?? null

  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...(entry?.data ?? {}) }))
  const [tags, setTags] = useState<string[]>(draft?.tags ?? [])
  const [slug, setSlug] = useState(entry?.slug ?? '')
  const [start, setStart] = useState(entry?.start_date ?? '')
  const [end, setEnd] = useState(entry?.end_date ?? '')
  const [visible, setVisible] = useState(entry?.visible ?? true)
  const [featured, setFeatured] = useState(entry?.featured ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const hasTags = section.field_schema.some((f) => f.type === 'tags')

  async function onSave() {
    setSaving(true)
    setError('')
    // collect only non-relation field data
    const data: Record<string, unknown> = {}
    for (const f of section.field_schema) {
      if (isRelationField(f.type)) continue
      const v = values[f.key]
      if (v !== undefined && v !== '') data[f.key] = v
    }
    const res = await saveEntry({
      id: entry?.id,
      sectionId: section.id,
      slug: slug || null,
      data,
      start_date: start || null,
      end_date: end || null,
      visible,
      featured,
      tags: hasTags ? tags : draft?.tags ?? [],
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
    <Drawer open={open} onClose={onClose} title={entry ? 'Edit entry' : 'New entry'}>
      <div className="space-y-4">
        {section.field_schema.map((f) => (
          <FieldInput
            key={f.key}
            def={f}
            value={values[f.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
          />
        ))}

        {hasTags ? null : (
          <p className="lettering text-[10px] text-slate">
            (This section has no tags field.)
          </p>
        )}

        <details className="border-t border-ink/15 pt-4">
          <summary className="lettering cursor-pointer text-[10px] text-slate">
            Advanced — slug, dates, featured
          </summary>
          <div className="mt-3 space-y-4">
            <Field label="Slug" hint="For a /work/… page. Lowercase, dashes.">
              <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-project" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start date">
                <TextInput type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="End date" hint="Blank = Present">
                <TextInput type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </Field>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="lettering text-[10px] text-slate">Featured</span>
                <div className="mt-1">
                  <Toggle checked={featured} onChange={setFeatured} labels={['No', 'Yes']} />
                </div>
              </div>
            </div>
          </div>
        </details>

        {entry ? (
          <div className="border-t border-ink/15 pt-4">
            <MediaManager entryId={entry.id} media={draft?.media ?? []} />
          </div>
        ) : null}

        {error ? <p className="text-[12px] text-redline">{error}</p> : null}

        <div className="flex items-center justify-between border-t border-ink/15 pt-4">
          <Toggle checked={visible} onChange={setVisible} />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : visible ? 'Publish' : 'Save draft'}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
