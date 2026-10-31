-- Oppfølginger — læringsfilene (fasit.json, funn.md, eval-historikk.md, rapport-siste.md) flyttes ut av det OFFENTLIGE repoet
-- og inn i databasen (2026-10-31). Kundenotater skal aldri ligge i GitHub. Skyjobben og Mac-skriptet henter/lagrer via
-- laering/sky.mjs (RPC-funksjoner + hemmelig token). Kjørt 31.10.2026 via Supabase MCP (apply_migration). Trygt å kjøre flere ganger.

create table if not exists public.oppf_laering_filer (
  navn         text primary key,                 -- 'fasit.json' | 'funn.md' | 'eval-historikk.md' | 'rapport-siste.md'
  innhold      text not null,
  oppdatert    timestamptz not null default now(),
  oppdatert_av text                              -- 'skyjobb' | 'mac' | 'claude-lokal'
);
-- Hver tidligere versjon arkiveres automatisk ved overskriving, så ingenting går tapt om en gjennomgang skriver feil.
create table if not exists public.oppf_laering_filer_historikk (
  id           bigint generated always as identity primary key,
  navn         text not null,
  innhold      text not null,
  oppdatert    timestamptz,
  oppdatert_av text,
  arkivert     timestamptz not null default now()
);
create or replace function public.oppf_laering_filer_arkiver() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.oppf_laering_filer_historikk (navn, innhold, oppdatert, oppdatert_av)
  values (old.navn, old.innhold, old.oppdatert, old.oppdatert_av);
  return new;
end $$;
drop trigger if exists oppf_laering_filer_arkiver on public.oppf_laering_filer;
create trigger oppf_laering_filer_arkiver before update on public.oppf_laering_filer
  for each row when (old.innhold is distinct from new.innhold) execute function public.oppf_laering_filer_arkiver();

-- Hemmelig nøkkel for skyjobben/Mac-skriptet. Leses BARE via Supabase-koblingen (databaserollen) – aldri i appen, repoet, logg eller rapport.
create table if not exists public.oppf_laering_noekkel (
  id    smallint primary key default 1 check (id = 1),
  token text not null,
  laget timestamptz not null default now()
);
insert into public.oppf_laering_noekkel (id, token)
values (1, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (id) do nothing;

-- Appen (anon/authenticated) har INGEN tilgang: RLS på uten policyer + alle rettigheter trukket.
alter table public.oppf_laering_filer           enable row level security;
alter table public.oppf_laering_filer_historikk enable row level security;
alter table public.oppf_laering_noekkel         enable row level security;
revoke all on public.oppf_laering_filer, public.oppf_laering_filer_historikk, public.oppf_laering_noekkel from anon, authenticated;

-- RPC-funksjoner for sky.mjs. Kjører som eier (security definer) og krever riktig token i hvert kall.
create or replace function public.laering_sjekk_token(p_token text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or length(p_token) < 32
     or not exists (select 1 from public.oppf_laering_noekkel where id = 1 and token = p_token) then
    raise exception 'ugyldig token' using errcode = '28000';
  end if;
end $$;
revoke execute on function public.laering_sjekk_token(text) from public, anon, authenticated;

create or replace function public.laering_liste(p_token text)
returns table (navn text, oppdatert timestamptz, oppdatert_av text, lengde integer)
language plpgsql security definer set search_path = public as $$
begin
  perform public.laering_sjekk_token(p_token);
  return query select f.navn, f.oppdatert, f.oppdatert_av, length(f.innhold) from public.oppf_laering_filer f order by f.navn;
end $$;

create or replace function public.laering_hent(p_token text, p_navn text) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  perform public.laering_sjekk_token(p_token);
  select innhold into v from public.oppf_laering_filer where navn = p_navn;
  return v;
end $$;

create or replace function public.laering_lagre(p_token text, p_navn text, p_innhold text, p_av text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.laering_sjekk_token(p_token);
  if p_navn !~ '^[a-z0-9._-]{1,60}$' then raise exception 'ugyldig filnavn'; end if;
  insert into public.oppf_laering_filer (navn, innhold, oppdatert, oppdatert_av) values (p_navn, p_innhold, now(), p_av)
  on conflict (navn) do update set innhold = excluded.innhold, oppdatert = now(), oppdatert_av = excluded.oppdatert_av;
end $$;

-- Rådata til eksport.mjs (erstatter kopiering av SQL-resultat via samtalen i skyjobben): snapshots + feil (30 d) + API-nøkkel.
create or replace function public.laering_eksport(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.laering_sjekk_token(p_token);
  return jsonb_build_object(
    'snapshots', (select coalesce(jsonb_agg(jsonb_build_object('email', email, 'data', data, 'app_build', app_build, 'last_seen_at', last_seen_at)), '[]'::jsonb)
                  from public.oppf_snapshots),
    'feil',      (select coalesce(jsonb_agg(jsonb_build_object('email', f.email, 'kind', f.kind, 'msg', f.msg, 'at', f.at, 'build', f.build)), '[]'::jsonb)
                  from (select email, kind, msg, at, build from public.client_log
                        where at > now() - interval '30 days' and kind in ('ai','js','promise') order by at desc limit 2000) f),
    'apikey',    (select anthropic_key from public.app_config where id = 1));
end $$;

revoke execute on function public.laering_liste(text), public.laering_hent(text, text),
  public.laering_lagre(text, text, text, text), public.laering_eksport(text) from public;
grant execute on function public.laering_liste(text), public.laering_hent(text, text),
  public.laering_lagre(text, text, text, text), public.laering_eksport(text) to anon, authenticated;
-- Trigger-funksjonen skal ikke kunne kalles via REST (Supabase-linteren varslet; triggeren selv virker uansett, den kjører som eier).
revoke execute on function public.oppf_laering_filer_arkiver() from public, anon, authenticated;
