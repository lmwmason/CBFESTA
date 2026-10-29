alter table public.festivals alter column ad_rate_per_minute set default 1;
update public.festivals set ad_rate_per_minute = 1 where ad_rate_per_minute = 10;
