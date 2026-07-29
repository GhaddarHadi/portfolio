-- One-time fix: grant the Supabase API roles access to the public tables.
-- (Row Level Security still governs WHICH rows each role can see — these grants
-- only let the API reach the tables at all. Normally Supabase applies these
-- automatically; run this if you hit "permission denied for table ...".)

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Make future tables inherit the same grants automatically.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
