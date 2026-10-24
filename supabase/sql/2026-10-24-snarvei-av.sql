-- 2026-10-24: snarveien «Lag oppfølging» bruker ikke lenger server-delene (appen build 2026-10-24-136 henter ikke innboksen,
-- selgeren limer inn selv). Varm-pingen hvert 3. minutt er da bare støy → skru den av. Tabeller og Edge Function kan ligge ubrukt.
-- Lim inn i Supabase → SQL Editor → Run.
select cron.unschedule('skjermbilde-varm');

-- Valgfritt senere (sletter data, ikke nødvendig): drop table public.oppf_innboks; drop table public.oppf_snarvei_nokkel;
