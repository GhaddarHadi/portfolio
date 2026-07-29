<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Portfolio — architecture & conventions

A schema-driven personal portfolio for Hadi Ghaddar. Content (sections, their
fields, entries) lives in the database as **data, not code** — new sections are
added from `/admin`, never by editing JSX.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Supabase** — Postgres, Auth (magic link, single user), Storage
- **Tailwind v4** (+ shadcn/ui in the admin, Phase 3)
- **Zod** — runtime validation of dynamic entry data
- Framer Motion, React Three Fiber, dnd-kit arrive in the phases that use them
- Deploy target: **Vercel**

## The one big idea

A `sections` row carries a `field_schema` (JSON array of `FieldDef`). That single
array drives BOTH:

1. the **public renderer** (`layout` string → a component in
   `components/layouts/registry.ts`)
2. the **admin form**, which generates its inputs from the field definitions

So "add a Speaking section next year" = one INSERT, zero deploys.

Field types: `text · textarea · markdown · url · date · number · boolean ·
string[] · tags · image · select`.
Layouts: `timeline · card_grid · chip_cloud · prose · stat_row · gallery`.

⚠️ `tags` and `image` are **relations, not jsonb keys** — they live in
`entry_tags` / `media`, not in `entries.data`. `lib/schema/field-types.ts`
(`isRelationField`) is the single source of truth for that distinction; the form
engine and renderer both honor it.

## Hard architecture rules

1. **All Supabase access goes through `lib/content`.** No `@/lib/supabase/*`
   import may appear in a component or page. Swapping the backend = this one
   folder changes.
2. **Public pages are statically generated** and revalidated on-demand when you
   publish from `/admin`. Visitors never hit the database (the free tier pauses
   after 7 days idle — a 3-day heartbeat cron keeps it awake, Phase 4).
3. **Security is Row Level Security, not React.** Policies live in
   `supabase/schema.sql`. Every admin route/action does a server-side session
   check; a client flag is never the gate.
4. **Typed end to end.** `lib/database.types.ts` mirrors the schema (regenerate
   with `supabase gen types`). Dynamic `data` payloads are validated with Zod
   schemas built at runtime from `field_schema`.
5. **Server actions for writes.** No API routes unless there's a real reason
   (the magic-link callback is the one unavoidable route handler).

## Supabase clients (`lib/supabase/`)

| File | Key | Use |
|------|-----|-----|
| `server.ts` | anon, request cookies | reads + owner-session writes; RLS decides visibility |
| `browser.ts` | anon | client components that need the auth session (login) |
| `admin.ts` | **service role**, `server-only` | jobs with no user session (heartbeat). Never client-side. |

The seed script builds its own service-role client because it runs outside Next.

## Layout

```
app/            (public) pages + admin/ (guarded) + auth/callback route
components/     sheet/ (title block — the signature) · hero/ (R3F) · layouts/ · admin/ · ui/
lib/content/    ← ONLY place that imports Supabase
lib/supabase/   the three clients
lib/schema/     field-types.ts + zod-from-fields.ts (runtime validation)
lib/database.types.ts
scripts/seed.ts
supabase/schema.sql
```

## Commands

```bash
npm run dev        # local dev
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run seed       # load resume content (creates the owner auth user if missing)
npm run peek       # print sections + their field schemas straight from the DB
npm run loginlink  # dev-only: mint a one-time login URL without waiting for email
```

## Setup (first run)

1. Create a project at supabase.com.
2. Paste `supabase/schema.sql` into the SQL editor and run it.
3. Copy `.env.local.example` → `.env.local`, fill in URL + anon + service-role keys.
4. `npm run dev`, log in once at `/admin/login` (Phase 3) so your auth user exists.
5. `npm run seed`.

## Review-pass decisions (Hadi, 2026-07-28)

Cut after seeing it live — do not reintroduce without asking:

- **Blueprint grid background** — decoration, not information.
- **Drafting title block** (SCALE 1:1 / REV / SHEET / DRAWN BY) — invented
  metadata. Replaced by `components/sheet/Footer.tsx`: contact, links, real
  last-updated date.
- **Pole loading envelope** ("the tent") in the 3D hero — that is analysis
  output, not what a plan sheet shows. Replaced with real conductor callouts.

Changed:

- Name now leads the hero; location is metadata beneath it.
- Section numbers sit in their own fixed 2.25rem column so 01/02/03 form a true
  left column instead of drifting with title length.
- Card labels are **derived from the section title** (`itemLabel()` in
  CardGrid) — "Projects" yields "PROJECT 01". Renaming the section in /admin
  renames the cards. Never hardcode the noun.
- Pole callouts live in `components/hero/pole-config.ts` as defaults, overridden
  by `profile.theme.hero_labels`, so annotations stay data. Both the WebGL and
  static SVG heroes render the same callouts.
- 3D hero no longer spins; it oscillates ±14° so leader lines stay readable.

## Image assets

Imported from Hadi's earlier `3d_portfolio` project via `npm run import-assets`
(idempotent — re-run replaces each cover):

- **Project covers** → Storage + a `media` row on the entry. `BB_logo` →
  billbuzz, `SM_logo` → soulmatch, `HadiEXP_logo` → 3d-tshirt-designer. The
  first media item is the cover: shown on the card and atop `/work/[slug]`, and
  excluded from that page's gallery so it isn't duplicated.
- **Tech logos** → `tech/` in the bucket, mapped in `lib/tech-logos.ts`. Only
  technologies actually named in the content were imported. Names still come
  from the database; a chip with no logo simply renders as text.
  - 9 from the old portfolio (`npm run import-assets`)
  - 4 generated brand-coloured from **simple-icons** (CC0) via
    `npm run import-icons`: Python, Android Studio, Firebase, Postman
  - **Deliberately absent:** OpenAI, Twilio and Plaid were withdrawn from
    simple-icons at the trademark holders' request — do not source them from
    elsewhere. SQL Server has no icon in the set. GIS and CAD are generic terms
    in the resume, not products, so an ArcGIS/AutoCAD mark would assert a vendor
    Hadi may not use. Katapult Pro, PoleForeman, SPIDAcalc, NESC and Workflow
    Manager are proprietary with no public icon. All render as text chips.
- **`components/site/ContourField.tsx`** — the flowing line field from Hadi's
  reference image. 98 paths across two clusters (a broad sweep left, a tight
  vortex right), stroked with blue→slate and blue→amber gradients instead of the
  original purple. Read in this project's language they are contour lines, true
  to the GIS work. Paths compute deterministically at module scope, so SSR and
  client match exactly.

  It lives on a **dark hero panel** (`.on-dark` in globals.css) that bleeds to
  the sheet border via negative margins — the single loud moment on an otherwise
  quiet bond-paper page. `.on-dark` redefines `--ink`/`--slate`/`--line`/
  `--panel`, so every child flips automatically instead of needing its own dark
  variants. The 3D pole's materials are correspondingly light (`WOOD`, `METAL`,
  light `INK`); a near-black conductor would vanish on that panel.

  A first attempt placed a sparse version behind a light hero, where it was
  effectively invisible — hence the density and the dark ground.

## Design language

The site is styled as a **construction drawing set** — sheet border, a live
title block / revision block (the signature element), drafting-lettering mono
for annotations. Palette from the APWA utility color code + drafting media
(bond, graphite, non-photo blue, redline accent). Grounded in Hadi's real
subject matter (plan sets, one-line diagrams, pole loading), not sci-fi.

## Status

- **Phase 1 — Foundation: DONE.** Scaffold, three Supabase clients, `lib/content`
  read layer, runtime Zod builder, seed script, this doc. Plus an early
  magic-link login (`/admin/login` + `/auth/callback` + a server-guarded
  `/admin` landing) so the seed has an auth user to attach to. Session-refresh
  middleware and the full dashboard come in Phase 3.
- Phase 2 — Public site (drawing-set layout, `/work/[slug]`, tag filter, JSON-LD)
- **Phase 3 — Admin: DONE.** `proxy.ts` session gate + per-route server checks,
  server actions for every write, self-generating editor drawer (inputs derived
  from `field_schema`), section builder (invent new sections + fields from the
  UI), dnd-kit reorder, draft/publish toggles with `revalidatePath`, image
  upload to Storage, profile editor, Export JSON.
- **Phase 4 — Signature + polish: DONE.** R3F pole-loading-envelope hero
  (lazy, `ssr:false`, skipped on <4 cores / save-data / reduced-motion, static
  SVG fallback always renders first so LCP never waits on WebGL), Framer Motion
  scroll reveals, ⌘K command palette built from the same data, `next/og` social
  card, print-optimized resume variants at `/r/[slug]` with a Save-as-PDF
  button, and a 3-day GitHub Actions heartbeat.

### PDF approach

`/r/[slug]` is a print-first page plus `window.print()`, not a PDF library.
It reuses the exact same content layer as the site (one source of truth), gives
real selectable text, and adds zero dependencies. `@media print` in globals.css
forces ink-on-paper regardless of the viewer's theme.

### Phase 3 gotchas worth remembering

- **dnd-kit + SSR**: its aria ids come from a module counter that differs
  server↔client, causing a hydration mismatch. Both boards mount the sortable
  context only after `useEffect` and render a plain static list first.
- **Next 16** renamed the `middleware` file convention to `proxy` (same API).
- Admin uses **custom form controls**, not shadcn/ui: `shadcn init` overwrites
  `globals.css` with its own token system, which would clobber the drawing-set
  theme. Same accessibility and API shape, no CSS collision.
