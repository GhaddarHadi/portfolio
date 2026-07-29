/**
 * Build the PUBLIC site as static files for GitHub Pages.
 *
 * Pages serves files, not a server, so anything that needs a request at runtime
 * cannot exist in this build: the admin dashboard (server actions, session
 * checks), the magic-link callback (route handler) and the proxy (middleware).
 * Next.js fails the export if those files are present, so they are moved aside
 * for the duration of the build and restored afterwards.
 *
 * The move is wrapped in try/finally and a SIGINT handler — a failed or
 * cancelled build must never leave the working tree missing the admin.
 *
 *   npm run build:pages
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stash = path.join(root, '.pages-stash')

/**
 * Paths that cannot exist in a static export.
 *
 * `components/admin` and `lib/content/admin.ts` are included because TypeScript
 * type-checks every file in the project, not only the reachable ones — they
 * import the moved server actions and would fail the build otherwise. Nothing
 * in the public site imports them.
 */
const SERVER_ONLY = [
  'app/admin',
  'app/auth',
  'proxy.ts',
  'components/admin',
  'lib/content/admin.ts',
]

const moved = []

/**
 * A dynamic route that generates zero pages is a hard error under
 * `output: export`. The resume variants at /r/[slug] only exist once the
 * variants read-policy is applied in Supabase, so ask the database first and
 * drop that route from the build while it would be empty.
 *
 * Self-healing: apply the policy and the resume pages appear on the next build,
 * no code change needed.
 */
async function hasVariants() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  try {
    const res = await fetch(`${url}/rest/v1/variants?select=slug&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return false
    return (await res.json()).length > 0
  } catch {
    return false
  }
}

/**
 * Windows throws EPERM when anything still holds a handle on a directory — a
 * running dev server, a file watcher, an indexer. The lock is usually transient,
 * so retry briefly before giving up with an explanation the user can act on.
 */
function renameWithRetry(from, to, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    try {
      fs.renameSync(from, to)
      return
    } catch (err) {
      const transient = err.code === 'EPERM' || err.code === 'EBUSY' || err.code === 'EACCES'
      if (!transient || i === attempts - 1) {
        if (transient) {
          throw new Error(
            `Could not move ${path.relative(root, from)} — a process is holding it.\n` +
              'Stop the dev server (npm run dev) and any editor file-watchers, then retry.',
          )
        }
        throw err
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250)
    }
  }
}

function stashServerOnly() {
  fs.mkdirSync(stash, { recursive: true })
  for (const rel of SERVER_ONLY) {
    const from = path.join(root, rel)
    if (!fs.existsSync(from)) continue
    const to = path.join(stash, rel.replace(/[\\/]/g, '__'))
    renameWithRetry(from, to)
    moved.push([from, to])
    console.log(`  … set aside ${rel}`)
  }
}

function restore() {
  for (const [from, to] of moved) {
    if (fs.existsSync(to) && !fs.existsSync(from)) {
      fs.mkdirSync(path.dirname(from), { recursive: true })
      renameWithRetry(to, from, 20) // restoring matters more — try harder
      console.log(`  … restored ${path.relative(root, from)}`)
    }
  }
  moved.length = 0
  if (fs.existsSync(stash) && fs.readdirSync(stash).length === 0) {
    fs.rmSync(stash, { recursive: true, force: true })
  }
}

// restore even if the build is interrupted
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    restore()
    process.exit(1)
  })
}

console.log('\nBuilding the public site for GitHub Pages…\n')

// load .env.local so the variants probe (and the build) see Supabase config
const envFile = path.join(root, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

if (!(await hasVariants())) {
  SERVER_ONLY.push('app/r')
  console.log(
    '  ! no readable resume variants — /r/[slug] excluded from this build.\n' +
      '    Apply supabase/variants-policies.sql to include the resume pages.',
  )
}

try {
  stashServerOnly()
  // The route set differs between the full app and the Pages export, and Next
  // caches generated route types in .next. Reusing them makes the type check
  // fail on routes (/admin) that no longer exist in this build.
  for (const dir of ['.next', 'out']) {
    fs.rmSync(path.join(root, dir), { recursive: true, force: true })
  }
  execSync('next build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PAGES_BUILD: '1' },
  })
} finally {
  restore()
}

// GitHub Pages runs Jekyll by default, which ignores directories beginning with
// an underscore — that would silently drop Next's entire /_next asset folder.
const out = path.join(root, 'out')
if (fs.existsSync(out)) {
  fs.writeFileSync(path.join(out, '.nojekyll'), '')
  console.log('\n✓ wrote out/.nojekyll (stops Jekyll eating /_next)')
  console.log(`✓ static site ready in out/ (${fs.readdirSync(out).length} top-level entries)\n`)
} else {
  console.error('\n✗ no out/ directory — the export did not complete\n')
  process.exit(1)
}
