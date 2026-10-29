create or replace function public.get_personal_leaderboard(target_festival_id bigint)
returns table(user_id uuid, display_name text, avatar_url text, score bigint)
language sql
stable
security definer
set search_path to ''
as $$
  select p.id, p.display_name, p.avatar_url, sum(mc.points_awarded)::bigint as score
  from public.mission_completions mc
  join public.profiles p on p.id = mc.user_id
  where mc.festival_id = target_festival_id
  group by p.id, p.display_name, p.avatar_url
  order by score desc
  limit 100;
$$;

grant execute on function public.get_personal_leaderboard(bigint) to anon, authenticated;
