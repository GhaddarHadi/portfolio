/**
 * Generate brand-coloured SVG logos from simple-icons (CC0) and upload them to
 * the media bucket's tech/ folder, matching the logos imported from the old
 * portfolio.
 *
 * Only technologies actually named in Hadi's content are included, and only
 * where an unambiguous official icon exists. Notably absent, on purpose:
 *   - OpenAI, Twilio, Plaid  — withdrawn from simple-icons at the trademark
 *     holders' request; not sourced from anywhere else.
 *   - SQL Server             — no icon in the set.
 *   - Katapult Pro, PoleForeman, SPIDAcalc, NESC, Workflow Manager,
 *     Face Recognition, DALL·E — proprietary, no public icon set. The utility
 *     tools among these get typographic monogram badges instead; see
 *     `monogram()` in lib/tech-logos.ts.
 *
 *   npm run import-icons
 */
import { config } from 'dotenv'
import path from 'node:path'
import * as si from 'simple-icons'
import { createClient } from '@supabase/supabase-js'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

/** storage filename -> simple-icons export key */
const ICONS: Record<string, string> = {
  'python.svg': 'siPython',
  'androidstudio.svg': 'siAndroidstudio',
  'firebase.svg': 'siFirebase',
  'postman.svg': 'siPostman',
  // Hadi confirmed he uses these specific products, so the vendor marks are accurate.
  'arcgis.svg': 'siArcgis',
  'autocad.svg': 'siAutocad',
}

const icons = si as unknown as Record<string, { title: string; hex: string; svg: string }>

/** simple-icons ships an uncoloured <svg>; paint it with the brand hex. */
function colorize(svg: string, hex: string): string {
  return svg.replace('<svg ', `<svg fill="#${hex}" `)
}

async function main() {
  let n = 0
  for (const [file, key] of Object.entries(ICONS)) {
    const icon = icons[key]
    if (!icon) {
      console.log(`… skip ${file}: ${key} not in simple-icons`)
      continue
    }
    const body = colorize(icon.svg, icon.hex)
    const { error } = await sb.storage
      .from('media')
      .upload(`tech/${file}`, new Blob([body], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        upsert: true,
      })
    if (error) throw new Error(`${file}: ${error.message}`)
    console.log(`✓ ${file.padEnd(22)} ${icon.title.padEnd(16)} #${icon.hex}`)
    n++
  }
  console.log(`\n${n} icons uploaded to tech/.\n`)
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
