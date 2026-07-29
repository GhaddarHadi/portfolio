// Dev helper: generates a one-time login token for the owner so a session can
// be established without waiting for an email. Not used in production.
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
  const email = (process.env.SEED_OWNER_EMAIL ?? 'hadimghaddar@gmail.com').toLowerCase()
  const { data, error } = await sb.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: 'http://localhost:3000/auth/callback' },
  })
  if (error) throw error
  const th = data.properties?.hashed_token
  console.log(`http://localhost:3000/auth/callback?token_hash=${th}&type=magiclink`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
