-- Let a student register who they're queuing with by student number,
-- instead of just a headcount. party_size is now derived server-side from
-- 1 (self) + the companion list, so the two can never disagree.

alter table public.queue_entries
  add column companion_student_numbers text[] not null default '{}';

drop function public.join_queue_for_actor(uuid, bigint, integer);

create function public.join_queue_for_actor(
  actor uuid,
  target_booth_id bigint,
  companion_numbers text[] default '{}'
)
returns queue_entries
language plpgsql
security definer
set search_path = ''
as $function$
declare
  target_booth public.booths%rowtype;
  next_number integer;
  computed_party_size integer;
  result public.queue_entries;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  computed_party_size := 1 + coalesce(array_length(companion_numbers, 1), 0);
  if computed_party_size not between 1 and 20 then
    raise exception 'Party size must be between 1 and 20';
  end if;
  select * into target_booth from public.booths where id = target_booth_id for share;
  if not found or target_booth.status <> 'open' or not target_booth.queue_enabled then
    raise exception 'Queue is not available';
  end if;
  if exists (
    select 1 from public.queue_entries
    where booth_id = target_booth_id and user_id = actor and status in ('waiting', 'called')
  ) then
    raise exception 'Already in queue';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(target_booth_id);
  select coalesce(max(queue_number), 0) + 1 into next_number
  from public.queue_entries where booth_id = target_booth_id;
  insert into public.queue_entries(booth_id, user_id, party_size, queue_number, companion_student_numbers)
  values (target_booth_id, actor, computed_party_size, next_number, companion_numbers)
  returning * into result;
  return result;
end;
$function$;

revoke all on function public.join_queue_for_actor(uuid, bigint, text[]) from public, anon, authenticated;
grant execute on function public.join_queue_for_actor(uuid, bigint, text[]) to service_role;
