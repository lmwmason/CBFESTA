alter table public.profiles add column student_number text;
alter table public.profiles add constraint profiles_student_number_format check (student_number is null or student_number ~ '^[A-Za-z0-9-]{2,20}$');
create unique index profiles_student_number_unique_idx on public.profiles (lower(student_number)) where student_number is not null;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, student_number, avatar_url)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), '사용자'), nullif(trim(new.raw_user_meta_data ->> 'student_number'), ''), nullif(new.raw_user_meta_data ->> 'avatar_url', ''))
  on conflict (id) do update set display_name = excluded.display_name, student_number = coalesce(excluded.student_number, public.profiles.student_number), avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of raw_user_meta_data on auth.users for each row execute function private.handle_new_user();

create policy profiles_festival_admin_read on public.profiles for select to authenticated using (
  exists (select 1 from public.festival_members target join public.festival_members actor on actor.festival_id = target.festival_id where target.user_id = profiles.id and actor.user_id = (select auth.uid()) and actor.role in ('owner', 'admin'))
);
