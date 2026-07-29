'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ProfileRow } from '@/lib/database.types'
import { saveProfile } from '@/app/admin/actions'
import { Field, TextInput, TextArea, Button } from './controls'

type Social = { label: string; url: string; icon?: string }

export function ProfileForm({ profile }: { profile: ProfileRow | null }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')
  const [summary, setSummary] = useState(profile?.summary ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [email, setEmail] = useState(profile?.email_public ?? '')
  const [socials, setSocials] = useState<Social[]>(
    (Array.isArray(profile?.socials) ? (profile?.socials as unknown as Social[]) : []) ?? [],
  )
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  async function onSave() {
    setSaving(true)
    setStatus('')
    const res = await saveProfile({
      full_name: fullName,
      headline: headline || null,
      summary: summary || null,
      location: location || null,
      email_public: email || null,
      socials,
    })
    setSaving(false)
    setStatus(res.ok ? 'Saved.' : res.error)
    if (res.ok) router.refresh()
  }

  return (
    <div className="max-w-xl space-y-4">
      <Field label="Full name">
        <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Headline" hint="Your one-line positioning — shows in the hero.">
        <TextInput value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </Field>
      <Field label="Summary" hint="Optional">
        <TextArea value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Public email" hint="Shown obfuscated on the site.">
          <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>

      <div className="border-t border-ink/15 pt-4">
        <div className="lettering mb-2 flex items-center justify-between text-[10px] text-slate">
          <span>Social links</span>
          <Button onClick={() => setSocials((s) => [...s, { label: '', url: '' }])}>+ Add</Button>
        </div>
        <div className="space-y-2">
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <TextInput
                placeholder="LinkedIn"
                value={s.label}
                onChange={(e) =>
                  setSocials((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                }
                className="w-1/3"
              />
              <TextInput
                placeholder="https://…"
                value={s.url}
                onChange={(e) =>
                  setSocials((prev) => prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
                }
              />
              <Button variant="danger" onClick={() => setSocials((prev) => prev.filter((_, j) => j !== i))}>
                ✕
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-ink/15 pt-4">
        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
        {status ? <span className="text-[12px] text-slate">{status}</span> : null}
      </div>
    </div>
  )
}
