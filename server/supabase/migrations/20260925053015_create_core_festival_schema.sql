create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.festivals (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null default '우리 학교 축제' check (char_length(name) between 1 and 60),
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'Asia/Seoul',
  status text not null default 'draft' check (status in ('draft', 'published', 'live', 'ended')),
  is_public boolean not null default false,
  logo_url text,
  primary_color text not null default '#f52a9a' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#ff6a5f' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color text not null default '#ffc85a' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  terminology jsonb not null default '{"team":"팀","mission":"미션","booth":"부스","point":"P"}'::jsonb,
  features jsonb not null default '{"teams":true,"missions":true,"leaderboard":true,"map":true,"qr_checkin":true}'::jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.festival_members (
  festival_id bigint not null references public.festivals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'participant' check (role in ('owner', 'admin', 'staff', 'booth_operator', 'participant')),
  custom_permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (festival_id, user_id)
);
create index festival_members_user_id_idx on public.festival_members(user_id);

create table public.categories (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  code text not null check (code ~ '^[A-Z][A-Z0-9_]*$'),
  description text,
  icon text,
  color text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (festival_id, code)
);
create index categories_festival_sort_idx on public.categories(festival_id, sort_order);

create table public.teams (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  logo_url text,
  primary_color text not null default '#f52a9a' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  score bigint not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (festival_id, name)
);
create index teams_festival_score_idx on public.teams(festival_id, score desc);

create table public.team_members (
  team_id bigint not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('captain', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index team_members_user_id_idx on public.team_members(user_id);

create table public.booths (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  short_description text check (short_description is null or char_length(short_description) <= 160),
  description text,
  location text,
  logo_url text,
  cover_url text,
  accent_color text not null default '#f52a9a' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  status text not null default 'draft' check (status in ('draft', 'open', 'paused', 'closed')),
  queue_size integer not null default 0 check (queue_size >= 0),
  estimated_wait_minutes integer not null default 0 check (estimated_wait_minutes between 0 and 600),
  operating_hours jsonb not null default '[]'::jsonb,
  offerings jsonb not null default '[]'::jsonb,
  content_blocks jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{"checkin_enabled":true,"queue_enabled":true,"mission_enabled":false,"show_operator":false,"cta_label":"참여하기","sections":["notice","offerings","location"]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index booths_festival_id_idx on public.booths(festival_id);
create index booths_category_id_idx on public.booths(category_id);

create table public.booth_members (
  booth_id bigint not null references public.booths(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'operator' check (role in ('manager', 'operator')),
  primary key (booth_id, user_id)
);
create index booth_members_user_id_idx on public.booth_members(user_id);

create table public.programs (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  category_id bigint references public.categories(id) on delete set null,
  booth_id bigint references public.booths(id) on delete set null,
  title text not null check (char_length(title) between 1 and 100),
  description text,
  kind text not null default 'mission' check (kind in ('mission', 'performance', 'food', 'exhibition', 'announcement', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published', 'live', 'paused', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  points integer not null default 0 check (points between 0 and 100000),
  cover_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index programs_festival_status_idx on public.programs(festival_id, status);
create index programs_category_id_idx on public.programs(category_id);
create index programs_booth_id_idx on public.programs(booth_id);

create or replace function private.has_festival_role(target_festival_id bigint, allowed_roles text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.festival_members
    where festival_id = target_festival_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;
revoke all on function private.has_festival_role(bigint, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_festival_role(bigint, text[]) to authenticated;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger festivals_set_updated_at before update on public.festivals for each row execute function private.set_updated_at();
create trigger teams_set_updated_at before update on public.teams for each row execute function private.set_updated_at();
create trigger booths_set_updated_at before update on public.booths for each row execute function private.set_updated_at();
create trigger programs_set_updated_at before update on public.programs for each row execute function private.set_updated_at();

create or replace function private.protect_last_owner()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') and
    (select count(*) from public.festival_members where festival_id = old.festival_id and role = 'owner') <= 1
  then
    raise exception 'A festival must retain at least one owner';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger festival_members_protect_last_owner
before update or delete on public.festival_members
for each row execute function private.protect_last_owner();

alter table public.profiles enable row level security;
alter table public.festivals enable row level security;
alter table public.festival_members enable row level security;
alter table public.categories enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.booths enable row level security;
alter table public.booth_members enable row level security;
alter table public.programs enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy festivals_public_read on public.festivals for select to anon, authenticated using (is_public or created_by = (select auth.uid()) or (select private.has_festival_role(id, array['owner','admin','staff','booth_operator','participant'])));
create policy festivals_create on public.festivals for insert to authenticated with check (created_by = (select auth.uid()));
create policy festivals_admin_update on public.festivals for update to authenticated using ((select private.has_festival_role(id, array['owner','admin']))) with check ((select private.has_festival_role(id, array['owner','admin'])));

create policy festival_members_read on public.festival_members for select to authenticated using (user_id = (select auth.uid()) or (select private.has_festival_role(festival_id, array['owner','admin'])));
create policy festival_members_bootstrap_owner on public.festival_members for insert to authenticated with check (
  (user_id = (select auth.uid()) and role = 'owner' and exists (select 1 from public.festivals where id = festival_id and created_by = (select auth.uid())))
  or (select private.has_festival_role(festival_id, array['owner','admin']))
);
create policy festival_members_owner_manage on public.festival_members for update to authenticated using ((select private.has_festival_role(festival_id, array['owner']))) with check ((select private.has_festival_role(festival_id, array['owner'])));
create policy festival_members_owner_delete on public.festival_members for delete to authenticated using ((select private.has_festival_role(festival_id, array['owner'])) and user_id <> (select auth.uid()));

create policy categories_public_read on public.categories for select to anon, authenticated using (is_visible or (select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy categories_admin_all on public.categories for all to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin']))) with check ((select private.has_festival_role(festival_id, array['owner','admin'])));

create policy teams_public_read on public.teams for select to anon, authenticated using (exists (select 1 from public.festivals f where f.id = festival_id and f.is_public) or (select private.has_festival_role(festival_id, array['owner','admin','staff','booth_operator','participant'])));
create policy teams_member_create on public.teams for insert to authenticated with check ((select private.has_festival_role(festival_id, array['owner','admin','participant'])));
create policy teams_admin_update on public.teams for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin']))) with check ((select private.has_festival_role(festival_id, array['owner','admin'])));

create policy team_members_read on public.team_members for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.teams t where t.id = team_id and (select private.has_festival_role(t.festival_id, array['owner','admin','staff']))));
create policy team_members_join on public.team_members for insert to authenticated with check (user_id = (select auth.uid()));

create policy booths_public_read on public.booths for select to anon, authenticated using (status in ('open','paused','closed') or (select private.has_festival_role(festival_id, array['owner','admin','staff','booth_operator'])));
create policy booths_admin_write on public.booths for all to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy booths_operator_update on public.booths for update to authenticated using (exists (select 1 from public.booth_members bm where bm.booth_id = id and bm.user_id = (select auth.uid()))) with check (exists (select 1 from public.booth_members bm where bm.booth_id = id and bm.user_id = (select auth.uid())));

create policy booth_members_read on public.booth_members for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin','staff']))));
create policy booth_members_admin_write on public.booth_members for all to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin']))) ) with check (exists (select 1 from public.booths b where b.id = booth_id and (select private.has_festival_role(b.festival_id, array['owner','admin']))) );

create policy programs_public_read on public.programs for select to anon, authenticated using (status in ('published','live','paused','ended') or (select private.has_festival_role(festival_id, array['owner','admin','staff','booth_operator'])));
create policy programs_admin_write on public.programs for all to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));

grant select on public.festivals, public.categories, public.teams, public.booths, public.programs to anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.festivals, public.festival_members, public.categories, public.teams, public.team_members, public.booths, public.booth_members, public.programs to authenticated;
grant delete on public.festival_members, public.categories, public.booth_members, public.programs to authenticated;
grant usage, select on all sequences in schema public to authenticated;
