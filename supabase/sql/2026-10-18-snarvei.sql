-- Oppfølginger — snarvei «Skjermbilde» (18.10.2026). Kjøres ÉN gang i Supabase → SQL Editor (hele fila kan limes inn samlet).
-- Trygt å kjøre flere ganger. Rører ingen eksisterende data.
--
-- Flyt: Kontrollsenter-snarveien på iPad tar skjermbilde og POSTer det til Edge Function «skjermbilde» med selgerens nøkkel.
-- Funksjonen lagrer bildet i bucket cardimg (<uid>/innboks-<id>.jpg) og en rad i oppf_innboks. Når appen åpnes (snarveien
-- åpner den), henter appen bildet, kjører samme AI-analyse som LIM INN og viser kontrollmenyen. Appen rydder etter seg.

-- ============================================================
-- 1) Nøkkel pr. selger (kun hash lagres; selve nøkkelen vises bare i appen under Min profil)
-- ============================================================
create table if not exists public.oppf_snarvei_nokkel (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  key_hash     text not null unique,          -- sha256(hex) av nøkkelen
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.oppf_snarvei_nokkel enable row level security;
drop policy if exists snarvei_nokkel_select_own on public.oppf_snarvei_nokkel;
drop policy if exists snarvei_nokkel_insert_own on public.oppf_snarvei_nokkel;
drop policy if exists snarvei_nokkel_update_own on public.oppf_snarvei_nokkel;
drop policy if exists snarvei_nokkel_delete_own on public.oppf_snarvei_nokkel;
create policy snarvei_nokkel_select_own on public.oppf_snarvei_nokkel
  for select to authenticated using (user_id = (select auth.uid()));
create policy snarvei_nokkel_insert_own on public.oppf_snarvei_nokkel
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy snarvei_nokkel_update_own on public.oppf_snarvei_nokkel
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy snarvei_nokkel_delete_own on public.oppf_snarvei_nokkel
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.oppf_snarvei_nokkel to authenticated;

-- ============================================================
-- 2) Innboks: skjermbilder som venter på at appen henter dem
--    INSERT skjer kun fra Edge Function (service role). Appen leser, krever (hentet_at) og sletter egne rader.
-- ============================================================
create table if not exists public.oppf_innboks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  path       text not null,                   -- sti i bucket cardimg: <uid>/innboks-<id>.jpg|png
  bytes      integer,
  created_at timestamptz not null default now(),
  hentet_at  timestamptz                      -- settes av appen i det bildet hentes (så to enheter ikke tar samme)
);
create index if not exists oppf_innboks_user_created on public.oppf_innboks (user_id, created_at desc);
alter table public.oppf_innboks enable row level security;
drop policy if exists innboks_select_own on public.oppf_innboks;
drop policy if exists innboks_update_own on public.oppf_innboks;
drop policy if exists innboks_delete_own on public.oppf_innboks;
create policy innboks_select_own on public.oppf_innboks
  for select to authenticated using (user_id = (select auth.uid()));
create policy innboks_update_own on public.oppf_innboks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy innboks_delete_own on public.oppf_innboks
  for delete to authenticated using (user_id = (select auth.uid()));
grant select, update, delete on public.oppf_innboks to authenticated;

-- Bildene ligger i selgerens egen mappe i bucket cardimg (samme mappe som kortbildene), så de eksisterende
-- storage-policyene (egen mappe + admin) dekker lesing og sletting fra appen. Ingen nye storage-policyer trengs.
