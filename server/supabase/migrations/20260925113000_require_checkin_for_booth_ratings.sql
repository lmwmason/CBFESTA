-- A rating is only meaningful after the participant has checked in at that booth.
drop policy if exists booth_ratings_own_insert on public.booth_ratings;
create policy booth_ratings_own_insert on public.booth_ratings
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.checkins
    where checkins.booth_id = booth_ratings.booth_id
      and checkins.user_id = (select auth.uid())
  )
);

drop policy if exists booth_ratings_own_update on public.booth_ratings;
create policy booth_ratings_own_update on public.booth_ratings
for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.checkins
    where checkins.booth_id = booth_ratings.booth_id
      and checkins.user_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.checkins
    where checkins.booth_id = booth_ratings.booth_id
      and checkins.user_id = (select auth.uid())
  )
);
