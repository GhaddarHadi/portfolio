/**
 * Load Hadi's certifications from LinkedIn into the schema-driven tables.
 *
 *  - adds a `credential_id` field to the certifications section's field_schema
 *  - replaces the certification entries (name, issuer, credential ID)
 *  - uploads issuer logos and attaches them as media rows
 *
 * Deliberately NO issue or expiry dates — Hadi asked for credential IDs only.
 * Adobe and Mile2 have no icon in simple-icons, so those render as initials
 * tiles; see ChipCloud.
 *
 *   npm run import-certs
 */
import { config } from 'dotenv'
import path from 'node:path'
import * as si from 'simple-icons'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import type { FieldDef } from '../lib/schema/field-types'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const sb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const icons = si as unknown as Record<string, { title: string; hex: string; svg: string }>

/** logo filename -> simple-icons key */
const LOGOS: Record<string, string> = {
  'anthropic.svg': 'siAnthropic',
  'claude.svg': 'siClaude',
  'comptia.svg': 'siComptia',
}

type Cert = {
  name: string
  issuer: string
  credential_id?: string
  logo?: string
}

// Ordered most-relevant-first for the two audiences Hadi is targeting.
const CERTS: Cert[] = [
  {
    name: 'CompTIA Security+',
    issuer: 'CompTIA',
    credential_id: 'COMP001022800348',
    logo: 'comptia.svg',
  },
  {
    name: 'ISO 27001: Information Security Management Systems Certified',
    issuer: 'Mile2 Cybersecurity Institute',
    credential_id: '23002-168-258-7763',
  },
  // NOTE: the resume's "Information Systems Security Officer" was the same
  // Mile2 credential as the ISO 27001 entry above — Hadi confirmed the
  // duplicate, so it is intentionally not listed here.
  {
    name: 'Certificate of Completion: AI Fluency Framework & Foundations',
    issuer: 'Anthropic',
    credential_id: '4hahws8xvuet',
    logo: 'anthropic.svg',
  },
  {
    name: 'Certificate of Completion: Claude 101',
    issuer: 'Anthropic',
    credential_id: 'nd2mf6m5q6mn',
    logo: 'claude.svg',
  },
  {
    name: 'Adobe Certified Associate in Graphic Design & Illustration Using Adobe Illustrator CS6',
    issuer: 'Adobe Illustrator — Tips, Tricks, & Tutorials',
  },
]

const FIELD_SCHEMA: FieldDef[] = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'issuer', label: 'Issuer', type: 'text' },
  { key: 'credential_id', label: 'Credential ID', type: 'text' },
]

async function main() {
  const { data: prof, error: profErr } = await sb.from('profile').select('owner_id').single()
  if (profErr) throw profErr
  const owner_id = prof.owner_id

  // 1. upload issuer logos
  for (const [file, key] of Object.entries(LOGOS)) {
    const icon = icons[key]
    if (!icon) {
      console.log(`… skip ${file}: ${key} missing`)
      continue
    }
    const svg = icon.svg.replace('<svg ', `<svg fill="#${icon.hex}" `)
    const { error } = await sb.storage
      .from('media')
      .upload(`certs/${file}`, new Blob([svg], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        upsert: true,
      })
    if (error) throw new Error(`${file}: ${error.message}`)
    console.log(`✓ logo ${file.padEnd(16)} ${icon.title}`)
  }

  // 2. section: add the credential_id field
  const { data: section, error: secErr } = await sb
    .from('sections')
    .update({ field_schema: FIELD_SCHEMA as unknown as Database['public']['Tables']['sections']['Update']['field_schema'] })
    .eq('slug', 'certifications')
    .select('id')
    .single()
  if (secErr) throw secErr
  console.log('✓ field_schema now includes credential_id')

  // 3. rebuild entries (media cascades on delete)
  const { error: delErr } = await sb.from('entries').delete().eq('section_id', section.id)
  if (delErr) throw delErr

  const rows = CERTS.map((c, i) => ({
    owner_id,
    section_id: section.id,
    sort_order: i,
    featured: false,
    visible: true,
    data: {
      name: c.name,
      issuer: c.issuer,
      ...(c.credential_id ? { credential_id: c.credential_id } : {}),
    } as unknown as Database['public']['Tables']['entries']['Insert']['data'],
  }))
  const { data: inserted, error: insErr } = await sb.from('entries').insert(rows).select('id, data')
  if (insErr) throw insErr

  // 4. attach logos as media
  const mediaRows = CERTS.flatMap((c, i) => {
    if (!c.logo) return []
    const entry = inserted![i]
    return [
      {
        owner_id,
        entry_id: entry.id,
        storage_path: `certs/${c.logo}`,
        alt: `${c.issuer} logo`,
        kind: 'logo',
        sort_order: 0,
      },
    ]
  })
  if (mediaRows.length) {
    const { error } = await sb.from('media').insert(mediaRows)
    if (error) throw error
  }

  console.log(`✓ Certifications: ${inserted!.length} entries, ${mediaRows.length} logos\n`)
  for (const c of CERTS) {
    console.log(`   ${c.credential_id ? c.credential_id.padEnd(20) : '—'.padEnd(20)} ${c.name.slice(0, 58)}`)
  }
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
