revoke execute on function public.assign_unassigned_students_to_teams(bigint, integer) from public;
grant execute on function public.assign_unassigned_students_to_teams(bigint, integer) to authenticated;

revoke execute on function public.purchase_booth_ad(bigint, integer, text) from public;
grant execute on function public.purchase_booth_ad(bigint, integer, text) to authenticated;

revoke execute on function public.update_team_branding(bigint, text, text, text) from public;
grant execute on function public.update_team_branding(bigint, text, text, text) to authenticated;

revoke execute on function public.get_personal_leaderboard(bigint) from public;
grant execute on function public.get_personal_leaderboard(bigint) to anon, authenticated;
