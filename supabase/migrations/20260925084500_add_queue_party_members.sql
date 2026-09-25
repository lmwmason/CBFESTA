-- A companion's student number now must resolve to a real registered
-- account, and that account gets its own queue_entries row (so it shows in
-- their own reservations) instead of just being recorded as text on the
-- leader's row. party_leader_id groups the leader + companion rows into one
-- party: null on the leader/solo row, set to the leader's id on companion
-- rows. Operators act on the whole party via party_leader_id; each member
-- sees their own row in "내 예약". 9999/9998 (the reserved staff student
-- numbers) can't be added as companions.

alter table public.queue_entries
  add column party_leader_id bigint references public.queue_entries(id) on delete cascade;

create index queue_entries_party_leader_idx on public.queue_entries(party_leader_id);

-- Any authenticated user may check whether a student number belongs to a
-- registered account, returning only what's needed to confirm a companion
-- (not the full profile, which profiles_read otherwise keeps private).
create or replace function public.lookup_student_by_number(target_student_number text)
returns table(user_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select id, display_name from public.profiles
  where student_number = target_student_number
  limit 1;
$$;
revoke all on function public.lookup_student_by_number(text) from public, anon;
grant execute on function public.lookup_student_by_number(text) to authenticated;

drop function public.join_queue_for_actor(uuid, bigint, text[]);

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
  companion_number text;
  companion_id uuid;
  companion_ids uuid[] := '{}';
  missing_numbers text[] := '{}';
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;
  computed_party_size := 1 + coalesce(array_length(companion_numbers, 1), 0);
  if computed_party_size not between 1 and 20 then
    raise exception 'Party size must be between 1 and 20';
  end if;

  foreach companion_number in array coalesce(companion_numbers, '{}') loop
    if companion_number in ('9999', '9998') then
      raise exception 'Reserved student numbers cannot be added as companions';
    end if;
    select id into companion_id from public.profiles where student_number = companion_number limit 1;
    if companion_id is null then
      missing_numbers := array_append(missing_numbers, companion_number);
    elsif companion_id = actor then
      raise exception 'Cannot add yourself as a companion';
    else
      companion_ids := array_append(companion_ids, companion_id);
    end if;
  end loop;
  if array_length(missing_numbers, 1) is not null then
    raise exception 'Unknown student numbers: %', array_to_string(missing_numbers, ', ');
  end if;

  select * into target_booth from public.booths where id = target_booth_id for share;
  if not found or target_booth.status <> 'open' or not target_booth.queue_enabled then
    raise exception 'Queue is not available';
  end if;
  if exists (
    select 1 from public.queue_entries
    where booth_id = target_booth_id and status in ('waiting', 'called')
      and (user_id = actor or user_id = any(companion_ids))
  ) then
    raise exception 'Already in queue';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(target_booth_id);
  select coalesce(max(queue_number), 0) + 1 into next_number
  from public.queue_entries where booth_id = target_booth_id;

  insert into public.queue_entries(booth_id, user_id, party_size, queue_number, companion_student_numbers)
  values (target_booth_id, actor, computed_party_size, next_number, companion_numbers)
  returning * into result;

  foreach companion_id in array companion_ids loop
    insert into public.queue_entries(booth_id, user_id, party_size, queue_number, party_leader_id)
    values (target_booth_id, companion_id, computed_party_size, next_number, result.id);
  end loop;

  return result;
end;
$function$;

revoke all on function public.join_queue_for_actor(uuid, bigint, text[]) from public, anon, authenticated;
grant execute on function public.join_queue_for_actor(uuid, bigint, text[]) to service_role;
