create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
create policy platform_admins_read_self on public.platform_admins for select to authenticated using (user_id = (select auth.uid()));
grant select on public.platform_admins to authenticated;

create or replace function private.attach_platform_admins_to_festival()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.festival_members (festival_id, user_id, role)
  select new.id, user_id, 'admin' from public.platform_admins
  on conflict (festival_id, user_id) do update set role = 'admin';
  return new;
end;
$$;
create trigger festivals_attach_platform_admins
after insert on public.festivals for each row execute function private.attach_platform_admins_to_festival();

create or replace function public.ensure_participant_membership()
returns bigint language plpgsql security definer set search_path = '' as $$
declare target_festival_id bigint; target_role text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select id into target_festival_id from public.festivals order by id asc limit 1;
  if target_festival_id is null then return null; end if;
  select case when exists (select 1 from public.platform_admins where user_id = (select auth.uid())) then 'admin' else 'participant' end into target_role;
  insert into public.festival_members (festival_id, user_id, role) values (target_festival_id, (select auth.uid()), target_role)
  on conflict (festival_id, user_id) do update set role = excluded.role where excluded.role = 'admin';
  return target_festival_id;
end;
$$;
