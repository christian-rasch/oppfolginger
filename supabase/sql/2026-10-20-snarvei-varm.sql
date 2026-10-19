-- Oppfølginger — hold Edge Function «skjermbilde» varm (20.10.2026). Kjøres ÉN gang i Supabase → SQL Editor. Trygt å kjøre flere ganger.
-- Hvorfor: etter en pause uten bruk starter funksjonen kaldt, og første skjermbilde fra snarveien tar 1–2 s ekstra.
-- Et lite ping hvert 3. minutt (hodet x-oppf-varm → funksjonen svarer straks, uten nøkkel/bilde) holder den våken.
-- Krever pg_cron (finnes fra før, se 2026-09-10-drift.sql) og pg_net (samme som push-varslene bruker).
create extension if not exists pg_net;
select cron.schedule(
  'skjermbilde-varm',
  '*/3 * * * *',
  $$select net.http_post(
      url     := 'https://lmomwyyaxjeobbfuklgv.supabase.co/functions/v1/skjermbilde',
      headers := '{"x-oppf-varm":"1","Content-Type":"application/json"}'::jsonb,
      body    := '{}'::jsonb)$$
);
-- Fjerne igjen: select cron.unschedule('skjermbilde-varm');
