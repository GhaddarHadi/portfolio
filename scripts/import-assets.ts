/**
 * Import image assets from the old 3d_portfolio project into Supabase Storage.
 *
 *  - project covers  -> uploaded + a `media` row linked to the entry
 *  - tech logos      -> uploaded to tech/ as UI assets (no media row)
 *
 * Only logos for technologies actually named in the portfolio are imported.
 * Idempotent: re-running replaces the cover for each project.
 *
 *   npm run import-assets
 */
import { config } from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const SRC = 'C:/Users/hadim/OneDrive/Documents/Projects/3d_portfolio/src/assets'

const sb = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

/** entry slug -> source file + alt text */
const COVERS: Record<string, { file: string; alt: string }> = {
  billbuzz: { file: 'BB_logo.png', alt: 'BillBuzz logo — a gold bee' },
  soulmatch: { file: 'SM_logo.png', alt: 'SoulMatch logo' },
  '3d-tshirt-designer': { file: 'HadiEXP_logo.png', alt: 'Monogram H logo' },
}

/** Only technologies that appear in the portfolio's own content. */
const TECH: Record<string, string> = {
  'html.png': 'tech/html.png',
  'css.png': 'tech/css.png',
  'javascript.png': 'tech/javascript.png',
  'tailwind.png': 'tech/tailwind.png',
  'tech/threejs.svg': 'tech/threejs.svg',
  'mongodb.png': 'tech/mongodb.png',
  'git.png': 'tech/git.png',
  'github.png': 'tech/github.png',
  'react_native.png': 'tech/react_native.png',
}

function contentType(f: string) {
  if (f.endsWith('.svg')) return 'image/svg+xml'
  if (f.endsWith('.jpg') || f.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

/** Resolve a source file that may live at the root or under tech/. */
function resolveSource(name: string): string | null {
  const direct = path.join(SRC, name)
  if (fs.existsSync(direct)) return direct
  const inTech = path.join(SRC, 'tech', name)
  if (fs.existsSync(inTech)) return inTech
  return null
}

async function upload(localPath: string, storagePath: string) {
  const bytes = fs.readFileSync(localPath)
  const { error } = await sb.storage
    .from('media')
    .upload(storagePath, bytes, { contentType: contentType(storagePath), upsert: true })
  if (error) throw new Error(`${storagePath}: ${error.message}`)
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✗ Source folder not found:\n  ${SRC}`)
    process.exit(1)
  }

  // owner id
  const { data: prof, error: profErr } = await sb.from('profile').select('owner_id').single()
  if (profErr) throw profErr
  const owner_id = prof.owner_id

  // ── project covers ────────────────────────────────────────────────────────
  for (const [slug, { file, alt }] of Object.entries(COVERS)) {
    const src = resolveSource(file)
    if (!src) {
      console.log(`… skip ${slug}: ${file} not found`)
      continue
    }
    const { data: entry } = await sb.from('entries').select('id').eq('slug', slug).maybeSingle()
    if (!entry) {
      console.log(`… skip ${slug}: no entry with that slug`)
      continue
    }

    // clear previous covers so re-running doesn't stack duplicates
    const { data: old } = await sb.from('media').select('id, storage_path').eq('entry_id', entry.id)
    if (old?.length) {
      await sb.storage.from('media').remove(old.map((m) => m.storage_path))
      await sb.from('media').delete().eq('entry_id', entry.id)
    }

    const storagePath = `${owner_id}/${entry.id}/cover${path.extname(file)}`
    await upload(src, storagePath)
    const { error } = await sb.from('media').insert({
      owner_id,
      entry_id: entry.id,
      storage_path: storagePath,
      alt,
      kind: 'cover',
      sort_order: 0,
    })
    if (error) throw error
    console.log(`✓ cover  ${slug.padEnd(20)} ${file}`)
  }

  // ── tech logos ────────────────────────────────────────────────────────────
  let n = 0
  for (const [file, storagePath] of Object.entries(TECH)) {
    const src = resolveSource(path.basename(file))
    if (!src) {
      console.log(`… skip logo ${file}: not found`)
      continue
    }
    await upload(src, storagePath)
    n++
  }
  console.log(`✓ tech logos: ${n}`)
  console.log('\nDone. Covers and logos are in Supabase Storage.\n')
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
