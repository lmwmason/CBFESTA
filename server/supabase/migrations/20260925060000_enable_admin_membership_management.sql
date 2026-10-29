drop policy if exists festival_members_bootstrap_owner on public.festival_members;
drop policy if exists festival_members_owner_manage on public.festival_members;
drop policy if exists festival_members_owner_delete on public.festival_members;

create policy festival_members_admin_insert
on public.festival_members for insert to authenticated
with check ((select private.has_festival_role(festival_id, array['owner', 'admin'])));

create policy festival_members_admin_update
on public.festival_members for update to authenticated
using ((select private.has_festival_role(festival_id, array['owner', 'admin'])))
with check ((select private.has_festival_role(festival_id, array['owner', 'admin'])));

create policy festival_members_admin_delete
on public.festival_members for delete to authenticated
using ((select private.has_festival_role(festival_id, array['owner', 'admin'])));

create or replace function private.prevent_admin_owner_promotion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.role = 'owner' and old.role <> 'owner'
    and not (select private.has_festival_role(old.festival_id, array['owner'])) then
    raise exception 'Only an owner can transfer ownership';
  end if;
  return new;
end;
$$;

create trigger festival_members_prevent_admin_owner_promotion
before update on public.festival_members
for each row execute function private.prevent_admin_owner_promotion();
