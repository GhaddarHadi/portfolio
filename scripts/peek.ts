// Dev helper: print current sections + entry counts straight from the database.
import { config } from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

config({ path: path.resolve(__dirname, '..', '.env.local') })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

async function main() {
  const { data, error } = await sb
    .from('sections')
    .select('id, slug, title, layout, sort_order, visible, field_schema')
    .order('sort_order')
  if (error) throw error
  for (const s of data!) {
    const fields = (s.field_schema as { key: string; type: string }[]) ?? []
    console.log(
      `${String(s.sort_order).padStart(2)}  ${s.slug.padEnd(18)} ${s.layout.padEnd(11)} ` +
        `vis=${s.visible}  fields=[${fields.map((f) => `${f.key}:${f.type}`).join(', ')}]`,
    )
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
