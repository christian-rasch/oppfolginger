-- Oppfølginger — LIVE FEED for admin (2026-10-28). Kjøres ÉN gang i Supabase → SQL Editor. Trygt å kjøre flere ganger. Rører ingen eksisterende data.
-- Appen (build ≥153) sender alt selgerne gjør (kortendringer felt for felt, knappetrykk, søk, faner, AI-skjema, Min profil) hit.
-- Bare admin (christian.rasch@snodriv.no) kan lese. Selgere kan bare skrive egne rader. Aldri passord/nøkler i data.
create table if not exists public.oppf_hendelser (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid(),
  email       text,
  at          timestamptz not null default now(),   -- når det skjedde på enheten
  kind        text not null,                        -- kort / innstilling
  type        text not null,                        -- kort.endret, kort.ai, kort.ai-skjema, knapp.salesforce, sok, fane, profil.varsel …
  item_id     text,                                 -- kortets id (når det gjelder et kort)
  data        jsonb,                                -- diff {felt:{fra,til}}, kort-øyeblikksbilde, tider
  build       text,
  device      text,                                 -- «1024×1366 pwa»
  received_at timestamptz not null default now()
);
create index if not exists oppf_hendelser_user_idx on public.oppf_hendelser (user_id, id desc);
create index if not exists oppf_hendelser_at_idx   on public.oppf_hendelser (at);
alter table public.oppf_hendelser enable row level security;
drop policy if exists oppf_hendelser_insert_own on public.oppf_hendelser;
create policy oppf_hendelser_insert_own on public.oppf_hendelser
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (email is null or lower(email) = lower((select auth.jwt()->>'email')))); -- egen rad OG egen e-post (kan ikke utgi seg for en annen)
drop policy if exists oppf_hendelser_admin_select on public.oppf_hendelser;
create policy oppf_hendelser_admin_select on public.oppf_hendelser
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
grant insert, select on public.oppf_hendelser to authenticated;
revoke update, delete on public.oppf_hendelser from anon, authenticated;   -- historikken kan ikke endres fra appen
-- opprydding: hendelser eldre enn 90 dager slettes hver natt (krever pg_cron, som alt er i bruk)
select cron.schedule('hendelser-cleanup', '25 3 * * *', $$delete from public.oppf_hendelser where at < now() - interval '90 days'$$);
-- Sjekk (valgfritt):
--   select at, email, kind, type, item_id, data from public.oppf_hendelser order by id desc limit 50;
