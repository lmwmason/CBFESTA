-- Postgres RLS ANDs every applicable SELECT policy into an UPDATE/DELETE's
-- row-visibility check for the same role, on top of the UPDATE policy's own
-- USING/WITH CHECK. announcements_public_read applied to `authenticated`
-- too but required is_published = true with no admin bypass, so it silently
-- combined with announcements_admin_update's check and made it impossible
-- for an admin to ever set is_published to false (or resolve/edit an
-- unpublished-looking row) — "new row violates row-level security policy
-- for table announcements" on every unpublish. Every other public-read
-- policy in this schema already ORs in has_festival_role(...) for exactly
-- this reason (see booths_public_read, categories_public_read, etc.);
-- announcements was the one table missing it.

drop policy announcements_public_read on public.announcements;
create policy announcements_public_read on public.announcements for select to anon, authenticated using (
  (is_published and (expires_at is null or expires_at > now()))
  or (select private.has_festival_role(festival_id, array['owner','admin','staff']))
);
