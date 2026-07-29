-- Phase 4 addition: make resume variants publicly readable for /r/<slug>,
-- while keeping the private `note` column unreadable by anonymous visitors.
-- (RLS is row-level; column privacy needs a column GRANT.)
-- Safe to re-run.

drop policy if exists "public reads variants" on public.variants;
drop policy if exists "public reads variant_entries" on public.variant_entries;

create policy "public reads variants" on public.variants for select using (true);
create policy "public reads variant_entries" on public.variant_entries for select using (true);

revoke select (note) on public.variants from anon;
