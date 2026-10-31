-- 2026-10-31: admin (christian.rasch@snodriv.no) kan LESE push_subscriptions (user_id/enabled) for å vise
-- «Push: N enheter» pr. selger i Min profil → Selgere. Selgerne er uendret (push_own_all: egen rad). Ingen skriving for admin.
drop policy if exists push_admin_read on public.push_subscriptions;
create policy push_admin_read on public.push_subscriptions
  for select to authenticated using ((select auth.jwt()->>'email') = 'christian.rasch@snodriv.no');
