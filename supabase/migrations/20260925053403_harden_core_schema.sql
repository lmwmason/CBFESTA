create index festivals_created_by_idx on public.festivals(created_by);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

drop policy categories_admin_all on public.categories;
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin'])));
create policy categories_admin_update on public.categories for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin']))) with check ((select private.has_festival_role(festival_id, array['owner','admin'])));
create policy categories_admin_delete on public.categories for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin'])));

drop policy booths_admin_write on public.booths;
drop policy booths_operator_update on public.booths;
create policy booths_admin_insert on public.booths for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy booths_manager_update on public.booths for update to authenticated
using (
  (select private.has_festival_role(festival_id, array['owner','admin','staff']))
  or exists (select 1 from public.booth_members bm where bm.booth_id = id and bm.user_id = (select auth.uid()))
)
with check (
  (select private.has_festival_role(festival_id, array['owner','admin','staff']))
  or exists (select 1 from public.booth_members bm where bm.booth_id = id and bm.user_id = (select auth.uid()))
);
create policy booths_admin_delete on public.booths for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin'])));

drop policy booth_members_admin_write on public.booth_members;
create policy booth_members_admin_insert on public.booth_members for insert to authenticated with check (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin']))));
create policy booth_members_admin_update on public.booth_members for update to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin'])))) with check (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin']))));
create policy booth_members_admin_delete on public.booth_members for delete to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin']))));

drop policy programs_admin_write on public.programs;
create policy programs_admin_insert on public.programs for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy programs_admin_update on public.programs for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy programs_admin_delete on public.programs for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin'])));
