-- booths_manager_update (and the equivalent operator checks on inventory_items /
-- queue_entries) inlined a raw `exists (select 1 from booth_members ...)` check.
-- booth_members' own read policy queries booths back, so evaluating the booths
-- policy re-entered booths' RLS mid-evaluation, which Postgres reports as
-- "infinite recursion detected in policy for relation \"booths\"" and surfaces
-- as a 500 on any booths/inventory_items/queue_entries write by a booth
-- operator (or by an owner/admin, since the operator branch is still planned
-- even when the role branch alone would pass).
--
-- Fix: route the booth_members membership check through a security definer
-- function (matching the existing private.has_festival_role /
-- private.can_manage_booth pattern), so it bypasses RLS internally instead of
-- re-entering it.

create or replace function private.is_booth_operator(target_booth_id bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.booth_members
    where booth_id = target_booth_id and user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_booth_operator(bigint) from public, anon;
grant execute on function private.is_booth_operator(bigint) to authenticated;

drop policy booths_manager_update on public.booths;
create policy booths_manager_update on public.booths for update to authenticated
using (
  (select private.has_festival_role(festival_id, array['owner','admin','staff']))
  or (select private.is_booth_operator(id))
)
with check (
  (select private.has_festival_role(festival_id, array['owner','admin','staff']))
  or (select private.is_booth_operator(id))
);

drop policy inventory_read on public.inventory_items;
create policy inventory_read on public.inventory_items for select to authenticated using (
  exists (
    select 1 from public.booths b
    where b.id = inventory_items.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin','staff']))
        or (select private.is_booth_operator(b.id))
      )
  )
);

drop policy inventory_insert on public.inventory_items;
create policy inventory_insert on public.inventory_items for insert to authenticated with check (
  exists (
    select 1 from public.booths b
    where b.id = inventory_items.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin']))
        or (select private.is_booth_operator(b.id))
      )
  )
);

drop policy inventory_update on public.inventory_items;
create policy inventory_update on public.inventory_items for update to authenticated
using (
  exists (
    select 1 from public.booths b
    where b.id = inventory_items.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin']))
        or (select private.is_booth_operator(b.id))
      )
  )
)
with check (
  exists (
    select 1 from public.booths b
    where b.id = inventory_items.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin']))
        or (select private.is_booth_operator(b.id))
      )
  )
);

drop policy inventory_delete on public.inventory_items;
create policy inventory_delete on public.inventory_items for delete to authenticated using (
  exists (
    select 1 from public.booths b
    where b.id = inventory_items.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin']))
        or (select private.is_booth_operator(b.id))
      )
  )
);

drop policy queue_entries_read on public.queue_entries;
create policy queue_entries_read on public.queue_entries for select to authenticated using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.booths b
    where b.id = queue_entries.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin','staff']))
        or (select private.is_booth_operator(b.id))
      )
  )
);

drop policy queue_entries_manage on public.queue_entries;
create policy queue_entries_manage on public.queue_entries for update to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.booths b
    where b.id = queue_entries.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin','staff']))
        or (select private.is_booth_operator(b.id))
      )
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.booths b
    where b.id = queue_entries.booth_id
      and (
        (select private.has_festival_role(b.festival_id, array['owner','admin','staff']))
        or (select private.is_booth_operator(b.id))
      )
  )
);
