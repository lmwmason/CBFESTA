create or replace function public.assign_unassigned_students_to_teams(
  target_festival_id bigint,
  desired_team_size integer default null
)
returns table(assigned_count integer, unassigned_count integer, teams_created integer)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  candidate record;
  target_team_id bigint;
  assigned integer := 0;
  remaining integer := 0;
  created integer := 0;
  eligible_count integer;
  existing_team_count integer;
  team_seq integer;
  i integer;
begin
  if (select auth.uid()) is null
     or not (select private.has_festival_role(target_festival_id, array['owner', 'admin'])) then
    raise exception 'Only festival administrators can assign teams';
  end if;

  perform pg_advisory_xact_lock(81473, target_festival_id::integer);

  select count(*) into eligible_count
  from public.festival_members fm
  join public.profiles p on p.id = fm.user_id
  where fm.festival_id = target_festival_id
    and p.account_type = 'student'
    and p.student_number ~ '^[1-9][0-9]{3}$'
    and p.student_number not in ('9999', '9998')
    and not exists (select 1 from public.team_members tm where tm.user_id = fm.user_id);

  if not exists (
    select 1 from public.teams
    where festival_id = target_festival_id and member_capacity > 0
  ) then
    if desired_team_size is null or desired_team_size <= 0 then
      raise exception 'Set a capacity for at least one team before automatic assignment';
    end if;
    if eligible_count > 0 then
      select count(*) into existing_team_count from public.teams where festival_id = target_festival_id;
      team_seq := existing_team_count;
      for i in 1..ceil(eligible_count::numeric / desired_team_size)::int loop
        team_seq := team_seq + 1;
        insert into public.teams (festival_id, name, primary_color, member_capacity)
        values (
          target_festival_id,
          team_seq || '팀',
          '#' || lpad(to_hex(floor(random() * 16777215)::int), 6, '0'),
          desired_team_size
        );
        created := created + 1;
      end loop;
    end if;
  end if;

  for candidate in
    select fm.user_id, left(coalesce(p.student_number, ''), 1) as grade
    from public.festival_members fm
    join public.profiles p on p.id = fm.user_id
    where fm.festival_id = target_festival_id
      and p.account_type = 'student'
      and p.student_number ~ '^[1-9][0-9]{3}$'
      and p.student_number not in ('9999', '9998')
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

  update public.team_members tm
  set role = 'captain'
  from (
    select distinct on (team_id) team_id, user_id
    from public.team_members
    where team_id in (select id from public.teams where festival_id = target_festival_id)
    order by team_id, joined_at
  ) first_member
  where tm.team_id = first_member.team_id
    and tm.user_id = first_member.user_id
    and not exists (
      select 1 from public.team_members c
      where c.team_id = tm.team_id and c.role = 'captain'
    );

  select count(*) into remaining
  from public.festival_members fm
  join public.profiles p on p.id = fm.user_id
  where fm.festival_id = target_festival_id
    and p.account_type = 'student'
    and p.student_number ~ '^[1-9][0-9]{3}$'
    and p.student_number not in ('9999', '9998')
    and not exists (select 1 from public.team_members tm where tm.user_id = fm.user_id);

  return query select assigned, remaining, created;
end;
$function$;

create or replace function public.update_team_branding(
  target_team_id bigint,
  new_name text,
  new_primary_color text,
  new_logo_url text default null
)
returns public.teams
language plpgsql
security definer
set search_path to ''
as $function$
declare
  result public.teams;
begin
  if not (select private.can_manage_team(target_team_id)) then
    raise exception 'Only the team captain or a festival admin can edit this team';
  end if;
  update public.teams
  set name = new_name,
      primary_color = new_primary_color,
      logo_url = coalesce(new_logo_url, logo_url)
  where id = target_team_id
  returning * into result;
  if result.id is null then
    raise exception 'Team not found';
  end if;
  return result;
end;
$function$;

create or replace function public.set_team_captain(
  target_team_id bigint,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if (select auth.uid()) is null
     or not exists (
       select 1 from public.teams t
       where t.id = target_team_id
         and (select private.has_festival_role(t.festival_id, array['owner', 'admin']))
     ) then
    raise exception 'Only festival administrators can change a team captain';
  end if;
  if not exists (select 1 from public.team_members where team_id = target_team_id and user_id = target_user_id) then
    raise exception 'That user is not a member of this team';
  end if;
  update public.team_members set role = 'member' where team_id = target_team_id and role = 'captain';
  update public.team_members set role = 'captain' where team_id = target_team_id and user_id = target_user_id;
end;
$function$;

grant execute on function public.update_team_branding(bigint, text, text, text) to authenticated;
grant execute on function public.set_team_captain(bigint, uuid) to authenticated;
