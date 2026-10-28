-- Oppfølginger — varsel-innstillinger pr. selger (2026-10-28). Kjøres ÉN gang i Supabase → SQL Editor.
-- Trygt å kjøre flere ganger. Rører ingen eksisterende data.
--
-- Kolonnen «varsler» holder selgerens standard for push-varsler som JSON:
--   {"min":5, "ekstra":false, "ekstraMin":15, "dagOn":false, "dagTid":"08:00"}
--   min      = minutter før avtalen hovedvarselet kommer
--   ekstra   = om et ekstra varsel skal sendes, ekstraMin = minutter før for det
--   dagOn    = daglig «Oppfølginger i dag: N», dagTid = klokkeslett (Oslo-tid)
-- Appen skriver kolonnen med UPDATE på egen rad (RLS «update_own» dekker den allerede),
-- Edge Function notify-appointments leser den med service role. Kort kan overstyre pr. kort
-- via feltet «varsel» inne i data-JSON-en — det krever ingen SQL.
-- Triggeren bumper updated_at kun når data endres, så denne kolonnen gir aldri synk-konflikt.

alter table public.oppf_snapshots add column if not exists varsler jsonb;

-- Sjekk etterpå (valgfritt):
--   select email, varsler from public.oppf_snapshots order by email;
