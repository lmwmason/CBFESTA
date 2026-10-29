insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('team-logos', 'team-logos', true, 5242880, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('booth-assets', 'booth-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_manage_team(target_team_id bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.team_members where team_id = target_team_id and user_id = (select auth.uid()) and role = 'captain')
    or exists (select 1 from public.teams t join public.festival_members fm on fm.festival_id = t.festival_id where t.id = target_team_id and fm.user_id = (select auth.uid()) and fm.role in ('owner','admin'))
  );
$$;
create or replace function private.can_manage_booth(target_booth_id bigint)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (select 1 from public.booth_members where booth_id = target_booth_id and user_id = (select auth.uid()))
    or exists (select 1 from public.booths b join public.festival_members fm on fm.festival_id = b.festival_id where b.id = target_booth_id and fm.user_id = (select auth.uid()) and fm.role in ('owner','admin','staff'))
  );
$$;
revoke all on function private.can_manage_team(bigint), private.can_manage_booth(bigint) from public, anon;
grant execute on function private.can_manage_team(bigint), private.can_manage_booth(bigint) to authenticated;

create policy team_logos_authenticated_select on storage.objects for select to authenticated using (bucket_id = 'team-logos');
create policy team_logos_insert on storage.objects for insert to authenticated with check (bucket_id = 'team-logos' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_team(((storage.foldername(name))[2])::bigint)));
create policy team_logos_update on storage.objects for update to authenticated using (bucket_id = 'team-logos' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_team(((storage.foldername(name))[2])::bigint))) with check (bucket_id = 'team-logos' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_team(((storage.foldername(name))[2])::bigint)));
create policy team_logos_delete on storage.objects for delete to authenticated using (bucket_id = 'team-logos' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_team(((storage.foldername(name))[2])::bigint)));

create policy booth_assets_authenticated_select on storage.objects for select to authenticated using (bucket_id = 'booth-assets');
create policy booth_assets_insert on storage.objects for insert to authenticated with check (bucket_id = 'booth-assets' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_booth(((storage.foldername(name))[2])::bigint)));
create policy booth_assets_update on storage.objects for update to authenticated using (bucket_id = 'booth-assets' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_booth(((storage.foldername(name))[2])::bigint))) with check (bucket_id = 'booth-assets' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_booth(((storage.foldername(name))[2])::bigint)));
create policy booth_assets_delete on storage.objects for delete to authenticated using (bucket_id = 'booth-assets' and (storage.foldername(name))[2] ~ '^[0-9]+$' and (select private.can_manage_booth(((storage.foldername(name))[2])::bigint)));
