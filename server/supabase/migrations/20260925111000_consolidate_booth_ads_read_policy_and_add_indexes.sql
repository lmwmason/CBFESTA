drop policy if exists booth_ads_manager_read on public.booth_ads;
drop policy if exists booth_ads_public_read on public.booth_ads;

create policy booth_ads_read on public.booth_ads
for select to anon, authenticated
using (
  (now() >= starts_at and now() <= ends_at)
  or (select private.can_manage_booth(booth_ads.booth_id))
);

create index if not exists booth_ads_created_by_idx on public.booth_ads (created_by);
create index if not exists booth_ratings_user_id_idx on public.booth_ratings (user_id);
