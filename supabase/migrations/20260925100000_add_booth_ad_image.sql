alter table public.booth_ads add column if not exists image_url text;

create or replace function public.purchase_booth_ad(target_booth_id bigint, hours integer, image_url text default null)
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
  if image_url is null or length(image_url) = 0 then
    raise exception 'An ad image is required';
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

  insert into public.booth_ads (booth_id, festival_id, starts_at, ends_at, cost, created_by, image_url)
  values (target_booth_id, booth_row.festival_id, now(), now() + (hours || ' hours')::interval, computed_cost, auth.uid(), image_url)
  returning * into result;

  return result;
end;
$function$;

grant execute on function public.purchase_booth_ad(bigint, integer, text) to authenticated;
drop function if exists public.purchase_booth_ad(bigint, integer);
