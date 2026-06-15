# Sky-synk (Supabase) — oppsett for Christian

Appen kan synke oppfølgingene (`oppf:index`) på tvers av iPad og PC via Supabase.
Sync er **valgfri**: så lenge nøklene ikke er fylt inn, fungerer appen helt som før (kun lokalt).
Koden ligger på git-grenen **`cloud-sync`** (ikke på `main` ennå).

> Viktig: innlogging/synk virker **kun fra https (GitHub Pages-URL-en)** — ikke når index.html
> åpnes som lokal fil. All synk-testing gjøres derfor på den publiserte siden.

---

## Steg 1 — Opprett Supabase-prosjekt
1. Gå til `supabase.com` → logg inn → **New project**.
2. Navn: f.eks. `oppfolginger`. **Region: velg EU** (Ireland eller Frankfurt) — pga. sensitive kundedata/GDPR.
3. Sett et databasepassord (lagre det trygt).
4. Vent til prosjektet er klart.

## Steg 2 — Hent URL + offentlig nøkkel
- **Project Settings → API**:
  - **Project URL** → `supabaseUrl`
  - **anon / public** (kan hete «publishable») → `supabaseAnonKey`
- ⚠️ Aldri bruk `service_role`-nøkkelen i appen. Anon-nøkkelen er trygg i den åpne fila (beskyttet av RLS + innlogging).

## Steg 3 — Kjør SQL
Supabase → **SQL Editor → New query** → lim inn alt under → **Run** (trygt å kjøre flere ganger):

```sql
create table if not exists public.oppf_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  client_id text,
  schema_version integer not null default 1
);

alter table public.oppf_snapshots enable row level security;

drop policy if exists "oppf_snapshots_select_own" on public.oppf_snapshots;
drop policy if exists "oppf_snapshots_insert_own" on public.oppf_snapshots;
drop policy if exists "oppf_snapshots_update_own" on public.oppf_snapshots;

create policy "oppf_snapshots_select_own"
on public.oppf_snapshots for select to authenticated
using ((select auth.uid()) = user_id);

create policy "oppf_snapshots_insert_own"
on public.oppf_snapshots for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "oppf_snapshots_update_own"
on public.oppf_snapshots for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_oppf_snapshots_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_oppf_snapshots_updated_at on public.oppf_snapshots;

create trigger trg_oppf_snapshots_updated_at
before update on public.oppf_snapshots
for each row execute function public.set_oppf_snapshots_updated_at();

grant select, insert, update on public.oppf_snapshots to authenticated;
```

## Steg 4 — Slå på e-post-innlogging
- **Authentication → Providers**: sjekk at **Email** er på (magic link bruker denne).
- (Innebygd e-post har lav grense, men nok for én bruker.)

## Steg 5 — Whiteliste URL-en din (ellers feiler innlogging)
- **Authentication → URL Configuration**:
  - **Site URL**: din GitHub Pages-adresse (f.eks. `https://christian-rasch.github.io/oppfolginger/` — bekreft eksakt URL).
  - **Redirect URLs**: legg til **nøyaktig samme** URL.

## Steg 6 — Lim inn nøklene i appen
I `index.html` (grenen `cloud-sync`), nær toppen av hovedscriptet:

```js
const CLOUD_SYNC_CONFIG={
  supabaseUrl:"PASTE_SUPABASE_URL_HERE",
  supabaseAnonKey:"PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE",
  table:"oppf_snapshots"
};
```
Bytt ut de to `PASTE_...`-verdiene. (Send dem til Claude Code, så limer han dem inn for deg — eller gjør det selv.)

## Steg 7 — Test på den publiserte siden
1. Push `cloud-sync` (eller merge til `main`) så endringene er live.
2. Åpne den live URL-en på Mac → klikk indikatoren oppe (viser «Sky av»/«Logg inn») → skriv e-post → **Send innloggingslenke** → åpne lenken i e-posten (samme enhet) → innlogget.
3. Indikatoren skal vise **«Synket»**; lokal data lastes opp til sky.
4. Åpne samme URL på iPad → logg inn med **samme** e-post → oppfølgingene lastes ned.
5. Endre et kort på iPad → på Mac, åpne indikator → **Synk nå** → endringen kommer inn.
6. Konflikt-test: endre på begge enheter før synk → appen skal spørre «Bruk denne enheten / Bruk skydata / Avbryt» før noe overskrives.

---

## Hvordan det virker (kort)
- **Lokal localStorage er alltid primær.** Sky er et tynt lag oppå.
- Snapshot-modell: én rad pr. innlogget bruker, hele lista lagret som JSON i `data`.
- Ved lokal lagring: skriver localStorage som før, så (debounced ~1,5 s) trygg synk hvis innlogget.
- Konflikt vises **kun** når både lokal og sky har endret seg siden sist synk — aldri automatisk overskriving.
- Synk-metadata ligger i egne nøkler (`oppf:cloud:*`) og rører aldri oppfølgingsdataene.
- `oppf:apikey` synkes **aldri**. Nettverks-/innloggingsfeil sletter aldri lokal data.
- Hvis nøkler mangler, CDN ikke laster, du er offline eller ikke innlogget → appen virker som før, indikator viser «Sky av»/«Lokal».

## Indikator-tilstander (oppe i appen)
`Lokal` · `Sky av` · `Logg inn` · `Synker…` · `Synket` · `Ikke synket` · `Konflikt` · `Feil`.
Klikk på indikatoren for innlogging / «Synk nå» / «Logg ut».
