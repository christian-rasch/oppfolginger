-- Oppfølginger — rapporter fra skyjobben (læringsgjennomgang + ukesrapport), vises kun for admin i Min profil (2026-10-29).
-- Kjørt 29.10.2026 via Supabase MCP (apply_migration «oppf_rapporter»). Trygt å kjøre flere ganger.
create table if not exists public.oppf_rapporter (
  id          bigint generated always as identity primary key,
  type        text not null,                       -- 'daglig' | 'uke' | 'signal'
  dato        date not null default current_date,
  tittel      text not null,
  innhold     text not null,                       -- Markdown
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists oppf_rapporter_dato_idx on public.oppf_rapporter (dato desc, id desc);
alter table public.oppf_rapporter enable row level security;
drop policy if exists oppf_rapporter_admin_select on public.oppf_rapporter;
create policy oppf_rapporter_admin_select on public.oppf_rapporter
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
grant select on public.oppf_rapporter to authenticated;
revoke insert, update, delete on public.oppf_rapporter from anon, authenticated;  -- bare skyjobben (databaserollen) skriver
