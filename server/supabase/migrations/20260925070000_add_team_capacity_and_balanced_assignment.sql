-- Student accounts are participants. Teacher accounts are operation-only until
-- an administrator grants an operational role.
alter table public.profiles
  add column account_type text not null default 'student'
  check (account_type in ('student', 'teacher'));

update public.profiles
set account_type = 'teacher'
where student_number is null;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, student_number, avatar_url, account_type)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), '사용자'),
    nullif(trim(new.raw_user_meta_data ->> 'student_number'), ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    case when new.raw_user_meta_data ->> 'account_type' = 'teacher' then 'teacher' else 'student' end
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    student_number = coalesce(excluded.student_number, public.profiles.student_number),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    account_type = excluded.account_type;
  return new;
end;
$$;

-- Every student account receives the participant role. Operational privileges are additive.
create table public.festival_member_roles (
  festival_id bigint not null references public.festivals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('participant', 'owner', 'admin', 'staff', 'booth_operator')),
  granted_at timestamptz not null default now(),
  primary key (festival_id, user_id, role)
);
create index festival_member_roles_lookup_idx on public.festival_member_roles(festival_id, user_id, role);

insert into public.festival_member_roles (festival_id, user_id, role)
select fm.festival_id, fm.user_id, 'participant'
from public.festival_members fm
join public.profiles p on p.id = fm.user_id and p.account_type = 'student'
on conflict do nothing;

insert into public.festival_member_roles (festival_id, user_id, role)
select festival_id, user_id, role from public.festival_members where role <> 'participant'
on conflict do nothing;

create or replace function private.sync_participant_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and account_type = 'student') then
    insert into public.festival_member_roles (festival_id, user_id, role)
    values (new.festival_id, new.user_id, 'participant')
    on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger festival_members_add_participant_role
after insert on public.festival_members
for each row execute function private.sync_participant_role();

create or replace function private.has_festival_role(target_festival_id bigint, allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.festival_member_roles
    where festival_id = target_festival_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;
revoke all on function private.has_festival_role(bigint, text[]) from public;
grant execute on function private.has_festival_role(bigint, text[]) to authenticated;

alter table public.festival_member_roles enable row level security;
create policy festival_member_roles_read on public.festival_member_roles
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_festival_role(festival_id, array['owner', 'admin']))
);
create policy festival_member_roles_admin_manage on public.festival_member_roles
for all to authenticated
using ((select private.has_festival_role(festival_id, array['owner', 'admin'])))
with check ((select private.has_festival_role(festival_id, array['owner', 'admin'])));
grant select, insert, delete on public.festival_member_roles to authenticated;

-- A student belongs to one festival team. Capacity is configured before placement.
alter table public.teams
  add column member_capacity integer not null default 0
  check (member_capacity between 0 and 2000);

create unique index team_members_one_team_per_user_idx
  on public.team_members(user_id);

create or replace function private.prevent_team_over_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_capacity integer;
begin
  select member_capacity into target_capacity
  from public.teams
  where id = new.team_id
  for update;

  if target_capacity is null or target_capacity = 0 then
    raise exception 'Set this team''s capacity before assigning students';
  end if;

  if (select count(*) from public.team_members where team_id = new.team_id) >= target_capacity then
    raise exception 'This team is already full';
  end if;
  return new;
end;
$$;

create trigger team_members_prevent_over_capacity
before insert on public.team_members
for each row execute function private.prevent_team_over_capacity();

create or replace function public.assign_unassigned_students_to_teams(target_festival_id bigint)
returns table(assigned_count integer, unassigned_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate record;
  target_team_id bigint;
  assigned integer := 0;
  remaining integer := 0;
begin
  if (select auth.uid()) is null
     or not (select private.has_festival_role(target_festival_id, array['owner', 'admin'])) then
    raise exception 'Only festival administrators can assign teams';
  end if;

  perform pg_advisory_xact_lock(81473, target_festival_id::integer);

  if not exists (
    select 1 from public.teams
    where festival_id = target_festival_id and member_capacity > 0
  ) then
    raise exception 'Set a capacity for at least one team before automatic assignment';
  end if;

  for candidate in
    select fm.user_id, left(coalesce(p.student_number, ''), 1) as grade
    from public.festival_members fm
    join public.profiles p on p.id = fm.user_id
    where fm.festival_id = target_festival_id
      and p.account_type = 'student'
      and p.student_number ~ '^[1-9][0-9]{3}$'
      and not exists (select 1 from public.team_members tm where tm.user_id = fm.user_id)
    order by left(p.student_number, 1), random()
  loop
    select t.id into target_team_id
    from public.teams t
    left join public.team_members tm on tm.team_id = t.id
    where t.festival_id = target_festival_id
    group by t.id, t.member_capacity
    having count(tm.user_id) < t.member_capacity
    order by count(tm.user_id), random()
    limit 1;

    if target_team_id is null then
      exit;
    end if;

    insert into public.team_members (team_id, user_id)
    values (target_team_id, candidate.user_id);
    assigned := assigned + 1;
  end loop;

  select count(*) into remaining
  from public.festival_members fm
  join public.profiles p on p.id = fm.user_id
  where fm.festival_id = target_festival_id
    and p.account_type = 'student'
    and p.student_number ~ '^[1-9][0-9]{3}$'
    and not exists (select 1 from public.team_members tm where tm.user_id = fm.user_id);

  return query select assigned, remaining;
end;
$$;

revoke all on function public.assign_unassigned_students_to_teams(bigint) from public, anon;
grant execute on function public.assign_unassigned_students_to_teams(bigint) to authenticated;
