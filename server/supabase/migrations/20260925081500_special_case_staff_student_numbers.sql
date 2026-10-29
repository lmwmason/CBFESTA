-- Student numbers 9999 (admin) and 9998 (booth_operator) are reserved staff
-- codes: signing up with one of these grants that role directly instead of
-- the default participant role, and skips participant entirely for that
-- account. Both functions read auth.users.raw_user_meta_data directly
-- (never public.profiles), because on_auth_user_auto_enroll fires before
-- on_auth_user_created alphabetically, so profiles does not exist yet when
-- this trigger chain runs.

create or replace function private.enroll_new_user_in_current_festival()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  target_festival_id bigint;
  new_student_number text;
  member_role text;
  extra_role text;
begin
  select id into target_festival_id from public.festivals order by id asc limit 1;
  if target_festival_id is null then return new; end if;

  new_student_number := nullif(trim(new.raw_user_meta_data ->> 'student_number'), '');

  if new_student_number = '9999' then
    member_role := 'admin';
    extra_role := 'admin';
  elsif new_student_number = '9998' then
    member_role := 'booth_operator';
    extra_role := 'booth_operator';
  else
    member_role := 'participant';
    extra_role := null;
  end if;

  insert into public.festival_members(festival_id, user_id, role)
  values (target_festival_id, new.id, member_role)
  on conflict (festival_id, user_id) do update set role = excluded.role where excluded.role <> 'participant';

  if extra_role is not null then
    insert into public.festival_member_roles(festival_id, user_id, role)
    values (target_festival_id, new.id, extra_role)
    on conflict do nothing;
  end if;

  return new;
end;
$function$;

create or replace function private.sync_participant_role()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  member_student_number text;
  member_account_type text;
begin
  select nullif(trim(raw_user_meta_data ->> 'student_number'), ''),
         coalesce(raw_user_meta_data ->> 'account_type', 'student')
    into member_student_number, member_account_type
  from auth.users where id = new.user_id;

  if member_student_number in ('9999', '9998') then
    return new;
  end if;

  if member_account_type = 'student' then
    insert into public.festival_member_roles (festival_id, user_id, role)
    values (new.festival_id, new.user_id, 'participant')
    on conflict do nothing;
  end if;
  return new;
end;
$function$;
