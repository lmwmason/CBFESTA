create or replace function public.join_queue_for_actor(
  actor uuid,
  target_booth_id bigint,
  requested_party_size integer default 1
)
returns public.queue_entries
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_booth public.booths%rowtype;
  next_number integer;
  result public.queue_entries;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  if requested_party_size not between 1 and 20 then
    raise exception 'Party size must be between 1 and 20';
  end if;

  select * into target_booth
  from public.booths
  where id = target_booth_id
  for share;

  if not found or target_booth.status <> 'open' or not target_booth.queue_enabled then
    raise exception 'Queue is not available';
  end if;

  if exists (
    select 1 from public.queue_entries
    where booth_id = target_booth_id
      and user_id = actor
      and status in ('waiting', 'called')
  ) then
    raise exception 'Already in queue';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(target_booth_id);
  select coalesce(max(queue_number), 0) + 1 into next_number
  from public.queue_entries
  where booth_id = target_booth_id;

  insert into public.queue_entries (booth_id, user_id, party_size, queue_number)
  values (target_booth_id, actor, requested_party_size, next_number)
  returning * into result;

  return result;
end;
$$;

revoke all on function public.join_queue_for_actor(uuid, bigint, integer) from public, anon, authenticated;
grant execute on function public.join_queue_for_actor(uuid, bigint, integer) to service_role;
