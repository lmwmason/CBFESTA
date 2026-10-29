create policy teams_admin_delete on public.teams
for delete to authenticated
using ((select private.has_festival_role(teams.festival_id, array['owner','admin'])));
