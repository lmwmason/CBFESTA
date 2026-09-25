create or replace function public.ensure_participant_membership()
returns bigint language plpgsql security definer set search_path = '' as $$
declare target_festival_id bigint;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select id into target_festival_id from public.festivals order by id asc limit 1;
  if target_festival_id is null then return null; end if;
  insert into public.festival_members (festival_id, user_id, role) values (target_festival_id, (select auth.uid()), 'participant') on conflict (festival_id, user_id) do nothing;
  return target_festival_id;
end;
$$;
revoke all on function public.ensure_participant_membership() from public, anon;
grant execute on function public.ensure_participant_membership() to authenticated;

create or replace function private.enroll_new_user_in_current_festival()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_festival_id bigint;
begin
  select id into target_festival_id from public.festivals order by id asc limit 1;
  if target_festival_id is not null then
    insert into public.festival_members (festival_id, user_id, role) values (target_festival_id, new.id, 'participant') on conflict (festival_id, user_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_auto_enroll on auth.users;
create trigger on_auth_user_auto_enroll after insert on auth.users for each row execute function private.enroll_new_user_in_current_festival();
