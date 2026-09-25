create or replace function public.lookup_student_by_number(target_student_number text)
returns table(user_id uuid, display_name text)
language sql
stable
security definer
set search_path to ''
as $$
  select id, display_name from public.profiles
  where (select auth.uid()) is not null
    and student_number = target_student_number
  limit 1;
$$;

create index if not exists festival_member_roles_user_id_idx
  on public.festival_member_roles (user_id);
