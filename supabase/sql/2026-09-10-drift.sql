-- Oppfølginger — drift-oppsett 2026-09-10. Kjøres ÉN gang i Supabase → SQL Editor (hele fila kan limes inn samlet).
-- Trygt å kjøre flere ganger (if not exists / or replace). Rører ingen eksisterende data.

-- ============================================================
-- 1) «Sist aktiv» = sist ÅPNET (hjerteslag fra appen), ikke sist endret.
--    updated_at bumpes nå KUN når selve lista (data) endres — hjerteslaget gir aldri falsk «Konflikt».
-- ============================================================
alter table public.oppf_snapshots add column if not exists last_seen_at timestamptz;

create or replace function public.set_oppf_snapshots_updated_at()
returns trigger language plpgsql as $$
begin
  if new.data is distinct from old.data then
    new.updated_at = now();
  end if;
  return new;
end;
$$;
-- (trigger trg_oppf_snapshots_updated_at BEFORE UPDATE finnes fra før og bruker denne funksjonen)

-- ============================================================
-- 2) Feillogg fra alle enheter (appen skriver; kun admin kan lese)
-- ============================================================
create table if not exists public.client_log (
  id          bigint generated always as identity primary key,
  user_id     uuid default auth.uid(),
  email       text,
  kind        text not null,          -- sync / admin / img / ai / js / promise / config
  msg         text,
  build       text,                   -- app-build på enheten
  ua          text,                   -- nettleser/enhet
  at          timestamptz not null default now(),   -- når det skjedde på enheten
  received_at timestamptz not null default now()    -- når raden kom inn
);
create index if not exists client_log_at on public.client_log (at desc);
alter table public.client_log enable row level security;
drop policy if exists client_log_insert_own on public.client_log;
create policy client_log_insert_own on public.client_log
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists client_log_admin_select on public.client_log;
create policy client_log_admin_select on public.client_log
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
grant insert, select on public.client_log to authenticated;

-- ============================================================
-- 3) Varsel-logg + hjerteslag for varsel-jobben (Edge Function skriver med service role; kun admin kan lese)
-- ============================================================
create table if not exists public.notif_log (
  id       bigint generated always as identity primary key,
  user_id  uuid,
  kind     text,                      -- appt / offer / test / test-offers
  item_id  text,
  endpoint text,
  status   int,
  ok       boolean not null default false,
  err      text,
  at       timestamptz not null default now()
);
create index if not exists notif_log_at on public.notif_log (at desc);
alter table public.notif_log enable row level security;
drop policy if exists notif_log_admin_select on public.notif_log;
create policy notif_log_admin_select on public.notif_log
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
grant select on public.notif_log to authenticated;

create table if not exists public.notif_status (
  id            int primary key default 1,
  last_run      timestamptz,
  last_sent     int,
  last_failed   int,
  last_error    text,
  last_error_at timestamptz
);
alter table public.notif_status enable row level security;
drop policy if exists notif_status_admin_select on public.notif_status;
create policy notif_status_admin_select on public.notif_status
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
grant select on public.notif_status to authenticated;
insert into public.notif_status (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- 4) Opprydding om natten (pg_cron er allerede aktivert): feillogg 60 dager, varsel-logg 30 dager
-- ============================================================
select cron.schedule('client-log-cleanup', '15 3 * * *', $$delete from public.client_log where at < now() - interval '60 days'$$);
select cron.schedule('notif-log-cleanup',  '20 3 * * *', $$delete from public.notif_log  where at < now() - interval '30 days'$$);

-- Sjekk etterpå (valgfritt):
--   select email, updated_at, last_seen_at, app_build from public.oppf_snapshots order by coalesce(last_seen_at, updated_at) desc;
--   select * from public.notif_status;
--   select at, email, kind, msg from public.client_log order by at desc limit 50;
