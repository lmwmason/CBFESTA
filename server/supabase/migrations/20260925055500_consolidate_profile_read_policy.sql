drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_festival_admin_read on public.profiles;

create policy profiles_read
on public.profiles for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.festival_members target
    join public.festival_members actor on actor.festival_id = target.festival_id
    where target.user_id = profiles.id
      and actor.user_id = (select auth.uid())
      and actor.role in ('owner', 'admin')
  )
);
