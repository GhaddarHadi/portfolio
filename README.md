# Hadi Ghaddar — Portfolio

A personal portfolio and resume site where **the content is data, not code**.
Sections, the fields they contain, and every entry live in Postgres. A `/admin`
dashboard generates its own editing forms from those field definitions, so new
jobs, skills — or an entirely new kind of section — can be added from the
browser with no code change and no redeploy.

**Live site:** _add your Vercel URL here after the first deploy_

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Data / auth / files | Supabase — Postgres, magic-link auth, Storage |
| Styling | Tailwind CSS v4 |
| 3D | React Three Fiber + three.js |
| Motion | Framer Motion |
| Drag & drop | dnd-kit |
| Validation | Zod (schemas built at runtime from field definitions) |
| Hosting | Vercel |

## How the schema-driven part works

A row in `sections` carries a `field_schema` — a JSON array describing its
fields. That one array drives two things at once:

1. the **public renderer** (`layout` → a React component in
   `components/layouts/registry.ts`)
2. the **admin form**, which builds its inputs from the field definitions

Adding a "Speaking" section next year is one insert, not a deploy.

Field types: `text · textarea · markdown · url · date · number · boolean ·
string[] · tags · image · select`
Layouts: `timeline · card_grid · chip_cloud · prose · stat_row · gallery`

## Architecture rules

- **All database access goes through `lib/content`.** No Supabase import exists
  in any component or page, so swapping the backend touches one folder.
- **Public pages are statically generated** and revalidated on demand when you
  publish from `/admin` — visitors never wait on a database query.
- **Security is Row Level Security**, defined in `supabase/schema.sql`. Admin
  routes additionally check the session server-side; a client flag is never the
  gate.
- **Writes are server actions.** The only route handlers are the ones that
  genuinely need to be (auth callback, JSON export).
- The service-role key is `server-only` and never reaches the browser.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase values
npm run seed                       # first run only — bootstraps content
npm run dev
```

Apply `supabase/schema.sql` in the Supabase SQL editor before seeding.
`supabase/grants.sql` and `supabase/variants-policies.sql` are follow-ups noted
in `AGENTS.md`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Bootstraps an **empty** project; never overwrites existing content |
| `npm run peek` | Prints sections and their field schemas from the database |
| `npm run loginlink` | Mints a one-time admin login URL (dev convenience) |
| `npm run import-assets` | Uploads project cover art and tech logos to Storage |
| `npm run import-icons` | Generates brand-coloured logos from simple-icons |
| `npm run import-certs` | Loads certifications and issuer logos |

## Deploying

The app deploys to Vercel with no configuration. Set these environment
variables in the Vercel project (Settings → Environment Variables):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key — safe in the browser, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Server-side only |
| `NEXT_PUBLIC_SITE_URL` | The deployed URL, e.g. `https://your-site.vercel.app` |

A GitHub Action (`.github/workflows/heartbeat.yml`) writes to the database every
three days so the free Supabase tier never pauses. It needs two repository
secrets: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Accessibility & performance

Responsive to 360px, semantic landmarks, visible keyboard focus, and
`prefers-reduced-motion` fully respected — the WebGL hero is skipped entirely on
reduced-motion, low-core and data-saver devices, where a static annotated SVG
renders instead. The 3D scene is lazy-loaded and never blocks first paint.

---

Architecture notes and design decisions are documented in [AGENTS.md](AGENTS.md).
