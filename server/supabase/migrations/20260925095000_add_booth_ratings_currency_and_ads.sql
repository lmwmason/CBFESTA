alter table public.booths add column if not exists ad_currency integer not null default 50;

create table if not exists public.booth_ratings (
  id bigint generated always as identity primary key,
  booth_id bigint not null references public.booths(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booth_id, user_id)
);
create index if not exists booth_ratings_booth_id_idx on public.booth_ratings (booth_id);

alter table public.booth_ratings enable row level security;

create policy booth_ratings_public_read on public.booth_ratings
for select to anon, authenticated
using (true);

create policy booth_ratings_own_insert on public.booth_ratings
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy booth_ratings_own_update on public.booth_ratings
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy booth_ratings_own_delete on public.booth_ratings
for delete to authenticated
using (user_id = (select auth.uid()));

create or replace function private.award_currency_for_rating()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  update public.booths set ad_currency = ad_currency + (new.stars * 4) where id = new.booth_id;
  return new;
end;
$$;

drop trigger if exists booth_ratings_award_currency on public.booth_ratings;
create trigger booth_ratings_award_currency
after insert on public.booth_ratings
for each row execute function private.award_currency_for_rating();

create table if not exists public.booth_ads (
  id bigint generated always as identity primary key,
  booth_id bigint not null references public.booths(id) on delete cascade,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  cost integer not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists booth_ads_active_idx on public.booth_ads (festival_id, starts_at, ends_at);
create index if not exists booth_ads_booth_id_idx on public.booth_ads (booth_id);

alter table public.booth_ads enable row level security;

create policy booth_ads_public_read on public.booth_ads
for select to anon, authenticated
using (now() between starts_at and ends_at);

create policy booth_ads_manager_read on public.booth_ads
for select to authenticated
using ((select private.can_manage_booth(booth_ads.booth_id)));

create or replace function public.purchase_booth_ad(target_booth_id bigint, hours integer)
returns public.booth_ads
language plpgsql
security definer
set search_path to ''
as $function$
declare
  rate constant integer := 10;
  max_hours constant integer := 24;
  booth_row public.booths;
  computed_cost integer;
  result public.booth_ads;
begin
  if not (select private.can_manage_booth(target_booth_id)) then
    raise exception 'Only this booth''s operators can buy ads for it';
  end if;
  if hours is null or hours < 1 or hours > max_hours then
    raise exception 'Choose between 1 and % hours', max_hours;
  end if;

  select * into booth_row from public.booths where id = target_booth_id for update;
  if booth_row.id is null then
    raise exception 'Booth not found';
  end if;

  computed_cost := hours * rate;
  if booth_row.ad_currency < computed_cost then
    raise exception 'Not enough currency: need %, have %', computed_cost, booth_row.ad_currency;
  end if;

  update public.booths set ad_currency = ad_currency - computed_cost where id = target_booth_id;

  insert into public.booth_ads (booth_id, festival_id, starts_at, ends_at, cost, created_by)
  values (target_booth_id, booth_row.festival_id, now(), now() + (hours || ' hours')::interval, computed_cost, auth.uid())
  returning * into result;

  return result;
end;
$function$;

grant execute on function public.purchase_booth_ad(bigint, integer) to authenticated;
