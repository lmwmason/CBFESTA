create index checkins_festival_id_idx on public.checkins(festival_id);
create index checkins_qr_code_id_idx on public.checkins(qr_code_id);

drop policy qr_codes_admin_write on public.qr_codes;
create policy qr_codes_admin_insert on public.qr_codes for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin'])));
create policy qr_codes_admin_update on public.qr_codes for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin']))) with check ((select private.has_festival_role(festival_id, array['owner','admin'])));
create policy qr_codes_admin_delete on public.qr_codes for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin'])));

drop policy inventory_manage on public.inventory_items;
create policy inventory_insert on public.inventory_items for insert to authenticated with check (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));
create policy inventory_update on public.inventory_items for update to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid()))))) with check (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));
create policy inventory_delete on public.inventory_items for delete to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));

drop policy announcements_admin_write on public.announcements;
create policy announcements_admin_insert on public.announcements for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy announcements_admin_update on public.announcements for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy announcements_admin_delete on public.announcements for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin'])));
