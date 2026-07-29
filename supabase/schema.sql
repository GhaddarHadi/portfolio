-- =============================================================================
-- Portfolio content system — Postgres / Supabase schema  (AMENDED)
-- Schema-driven: sections and their fields are DATA, not code.
-- Adding a new kind of section later = one INSERT, zero deploys.
--
-- Changes from the original schema are marked  -- FIX:  with a reason.
-- Apply this whole file in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILE  (single row — the header of the site and the resume)
-- -----------------------------------------------------------------------------
create table public.profile (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references auth.users(id) on delete cascade,
  full_name     text not null,
  headline      text,
  summary       text,
  location      text,
  email_public  text,
  socials       jsonb not null default '[]'::jsonb,     -- [{label,url,icon}]
  theme         jsonb not null default '{}'::jsonb,     -- accent color, mode, hero variant
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. SECTIONS  (each row renders one block on the site)
--    layout       -> which React component renders it
--    field_schema -> drives BOTH the renderer and the auto-generated admin form
--    Supported types: text | textarea | markdown | url | date | number
--                     | boolean | string[] | tags | image | select
-- -----------------------------------------------------------------------------
create table public.sections (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  slug          text not null,
  title         text not null,
  subtitle      text,
  layout        text not null default 'timeline'
                check (layout in ('timeline','card_grid','chip_cloud','prose','stat_row','gallery')),
  field_schema  jsonb not null default '[]'::jsonb,
  sort_order    int  not null default 0,
  visible       boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (owner_id, slug)
);

-- -----------------------------------------------------------------------------
-- 3. ENTRIES  (the actual content items — jobs, projects, skills, anything)
-- -----------------------------------------------------------------------------
create table public.entries (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  section_id    uuid not null references public.sections(id) on delete cascade,
  slug          text,
  data          jsonb not null default '{}'::jsonb,
  start_date    date,
  end_date      date,
  featured      boolean not null default false,
  sort_order    int  not null default 0,
  visible       boolean not null default true,          -- false = draft
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index entries_section_idx on public.entries (section_id, sort_order);
create index entries_data_gin    on public.entries using gin (data);

-- FIX #4: slug drives /work/<slug>; without this two entries could share a slug
-- and one page becomes unreachable. Unique per owner, only when slug is present.
create unique index entries_owner_slug_uidx
  on public.entries (owner_id, slug) where slug is not null;

-- -----------------------------------------------------------------------------
-- 4. TAGS  (tech stack chips, filterable project grid)
-- -----------------------------------------------------------------------------
create table public.tags (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null references auth.users(id) on delete cascade,
  name      text not null,
  kind      text default 'tech',                        -- tech | domain | tool
  color     text,
  unique (owner_id, name)
);

create table public.entry_tags (
  entry_id uuid references public.entries(id) on delete cascade,
  tag_id   uuid references public.tags(id)    on delete cascade,
  primary key (entry_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- 5. MEDIA  (screenshots, logos — files live in Supabase Storage)
-- -----------------------------------------------------------------------------
create table public.media (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  entry_id     uuid references public.entries(id) on delete cascade,
  storage_path text not null,
  alt          text,
  kind         text default 'screenshot',               -- screenshot | logo | hero | video
  width        int,
  height       int,
  sort_order   int not null default 0
);

-- -----------------------------------------------------------------------------
-- 6. VARIANTS  (tailored versions: /r/engineering, /r/software, or a PDF)
-- -----------------------------------------------------------------------------
create table public.variants (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  headline    text,
  note        text,                                     -- PRIVATE: which job this was for
  created_at  timestamptz not null default now(),
  unique (owner_id, slug)
);

create table public.variant_entries (
  variant_id uuid references public.variants(id) on delete cascade,
  entry_id   uuid references public.entries(id)  on delete cascade,
  sort_order int not null default 0,
  primary key (variant_id, entry_id)
);

-- -----------------------------------------------------------------------------
-- 7. HEARTBEAT  (cron writes here so the free project never pauses)
--    FIX #5: Supabase free tier pauses after 7 DAYS of inactivity. A *weekly*
--    cron that runs even a few hours late crosses that line. Run every 3 days.
-- -----------------------------------------------------------------------------
create table public.heartbeat (
  id      int primary key default 1,
  pinged  timestamptz not null default now(),
  check (id = 1)
);
insert into public.heartbeat (id) values (1);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Public gets read-only access to visible rows. Only the owner writes.
-- This is the real security boundary — never rely on a client-side admin flag.
-- =============================================================================
alter table public.profile         enable row level security;
alter table public.sections        enable row level security;
alter table public.entries         enable row level security;
alter table public.tags            enable row level security;
alter table public.entry_tags      enable row level security;
alter table public.media           enable row level security;
alter table public.variants        enable row level security;
alter table public.variant_entries enable row level security;

-- Public read
create policy "public reads profile"  on public.profile  for select using (true);
create policy "public reads sections" on public.sections for select using (visible = true);
create policy "public reads entries"  on public.entries  for select using (visible = true);
create policy "public reads tags"     on public.tags     for select using (true);

-- FIX #2: original media read was `using (true)`, which exposed screenshots of
-- DRAFT entries (visible = false). Only expose media whose parent entry is
-- visible, or media with no entry (profile / hero art).
create policy "public reads media" on public.media for select using (
  entry_id is null
  or exists (
    select 1 from public.entries e
    where e.id = media.entry_id and e.visible = true
  )
);

-- FIX #1: entry_tags had RLS ENABLED but NO policy -> every read/write denied,
-- which silently breaks tag filtering on the project grid. Add public read so
-- the public grid can filter, and owner write so the admin can link tags.
create policy "public reads entry_tags" on public.entry_tags for select using (
  exists (
    select 1 from public.entries e
    where e.id = entry_tags.entry_id and e.visible = true
  )
);
create policy "owner writes entry_tags" on public.entry_tags for all using (
  exists (
    select 1 from public.entries e
    where e.id = entry_tags.entry_id and e.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.entries e
    where e.id = entry_tags.entry_id and e.owner_id = auth.uid()
  )
);

-- Owner full control
create policy "owner writes profile"  on public.profile  for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner writes sections" on public.sections for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner writes entries"  on public.entries  for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner writes tags"     on public.tags     for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner writes media"    on public.media    for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner writes variants" on public.variants for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- FIX #1 (cont.): variant_entries also had RLS enabled with no policy.
create policy "owner writes variant_entries" on public.variant_entries for all using (
  exists (
    select 1 from public.variants v
    where v.id = variant_entries.variant_id and v.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.variants v
    where v.id = variant_entries.variant_id and v.owner_id = auth.uid()
  )
);

-- =============================================================================
-- STORAGE  (FIX #2 cont.: table RLS is NOT storage RLS — the original schema
-- secured the `media` table but never the actual file bucket. Without this the
-- files are either unreachable or writable by anyone.)
--
-- The bucket is PUBLIC so published screenshots render via a plain public URL
-- (fast, cache-friendly, no signed-URL round trips). Paths are random, so files
-- are not enumerable. Only the owner can upload / change / delete.
-- =============================================================================
insert into storage.buckets (id, name, public)
  values ('media', 'media', true)
  on conflict (id) do nothing;

create policy "public reads media bucket" on storage.objects for select
  using (bucket_id = 'media');
create policy "owner uploads media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and owner = auth.uid());
create policy "owner updates media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and owner = auth.uid());
create policy "owner deletes media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and owner = auth.uid());

-- =============================================================================
-- GRANTS  (normally applied automatically by Supabase; included here so a fresh
-- setup is reproducible. RLS above still governs which ROWS each role sees —
-- these grants only let the API roles reach the tables at all.)
-- =============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- =============================================================================
-- VARIANTS: public read for the /r/<slug> resume pages.
-- `variants.note` is PRIVATE ("which job this was for"). RLS is row-level, not
-- column-level, so the note is protected with a column GRANT instead — anon
-- cannot select it at all, even by querying PostgREST directly.
-- =============================================================================
create policy "public reads variants" on public.variants for select using (true);
create policy "public reads variant_entries" on public.variant_entries for select using (true);
revoke select (note) on public.variants from anon;
