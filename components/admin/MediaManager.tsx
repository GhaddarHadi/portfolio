'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Media } from '@/lib/content'
import { uploadEntryImage, deleteMedia } from '@/app/admin/actions'
import { Button } from './controls'

/** Upload / list / delete images for an existing entry. */
export function MediaManager({ entryId, media }: { entryId: string; media: Media[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    const fd = new FormData()
    fd.set('file', file)
    const res = await uploadEntryImage(entryId, fd)
    setBusy(false)
    e.target.value = ''
    if (!res.ok) setError(res.error)
    else router.refresh()
  }

  async function onDelete(id: string) {
    setBusy(true)
    await deleteMedia(id)
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      <div className="lettering mb-2 text-[10px] text-slate">Images</div>
      {media.length ? (
        <ul className="mb-3 grid grid-cols-3 gap-2">
          {media.map((m) => (
            <li key={m.id} className="group relative border border-ink/20 bg-panel p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt ?? ''} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => onDelete(m.id)}
                className="lettering absolute right-1 top-1 rounded-[2px] bg-ink/70 px-1 text-[9px] text-bond opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <label className="lettering inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-ink/30 bg-panel px-3 py-1.5 text-[11px] hover:border-ink/60">
        {busy ? 'Uploading…' : '+ Upload image'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      {error ? <p className="mt-2 text-[11px] text-redline">{error}</p> : null}
    </div>
  )
}
