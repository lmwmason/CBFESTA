alter table public.festivals add column if not exists ad_rate_per_minute integer not null default 10;
alter table public.festivals add column if not exists ad_max_minutes integer not null default 240;
alter table public.festivals add constraint festivals_ad_rate_per_minute_check check (ad_rate_per_minute > 0);
alter table public.festivals add constraint festivals_ad_max_minutes_check check (ad_max_minutes > 0);

drop function if exists public.purchase_booth_ad(bigint, integer, text);

create function public.purchase_booth_ad(target_booth_id bigint, minutes integer, image_url text default null)
returns public.booth_ads
language plpgsql
security definer
set search_path to ''
as $function$
declare
  booth_row public.booths;
  festival_row public.festivals;
  computed_cost integer;
  result public.booth_ads;
begin
  if not (select private.can_manage_booth(target_booth_id)) then
    raise exception 'Only this booth''s operators can buy ads for it';
  end if;
  if image_url is null or length(image_url) = 0 then
    raise exception 'An ad image is required';
  end if;

  select * into booth_row from public.booths where id = target_booth_id for update;
  if booth_row.id is null then
    raise exception 'Booth not found';
  end if;

  select * into festival_row from public.festivals where id = booth_row.festival_id;

  if minutes is null or minutes < 1 or minutes > festival_row.ad_max_minutes then
    raise exception 'Choose between 1 and % minutes', festival_row.ad_max_minutes;
  end if;

  computed_cost := minutes * festival_row.ad_rate_per_minute;
  if booth_row.ad_currency < computed_cost then
    raise exception 'Not enough currency: need %, have %', computed_cost, booth_row.ad_currency;
  end if;

  update public.booths set ad_currency = ad_currency - computed_cost where id = target_booth_id;

  insert into public.booth_ads (booth_id, festival_id, starts_at, ends_at, cost, created_by, image_url)
  values (target_booth_id, booth_row.festival_id, now(), now() + (minutes || ' minutes')::interval, computed_cost, auth.uid(), image_url)
  returning * into result;

  return result;
end;
$function$;

grant execute on function public.purchase_booth_ad(bigint, integer, text) to authenticated;
