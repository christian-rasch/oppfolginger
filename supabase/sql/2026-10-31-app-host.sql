-- 2026-10-31: hvilken adresse hver selger bruker (hjerteslaget sender location.hostname).
-- Vises i Min profil → Selgere (admin) som «Ny adresse» / «Gammel adresse». Kjørt 31.10.2026 via Supabase MCP.
alter table public.oppf_snapshots add column if not exists app_host text;
