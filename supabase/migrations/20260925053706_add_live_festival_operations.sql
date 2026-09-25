create extension if not exists pgcrypto with schema extensions;

create table public.qr_codes (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  booth_id bigint references public.booths(id) on delete cascade,
  program_id bigint references public.programs(id) on delete cascade,
  token_hash text not null unique,
  label text not null,
  is_active boolean not null default true,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(booth_id, program_id) = 1)
);
create index qr_codes_festival_id_idx on public.qr_codes(festival_id);
create index qr_codes_booth_id_idx on public.qr_codes(booth_id);
create index qr_codes_program_id_idx on public.qr_codes(program_id);
create index qr_codes_created_by_idx on public.qr_codes(created_by);

create table public.checkins (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  booth_id bigint not null references public.booths(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  qr_code_id bigint references public.qr_codes(id) on delete set null,
  checked_in_at timestamptz not null default now()
);
create index checkins_booth_time_idx on public.checkins(booth_id, checked_in_at desc);
create index checkins_user_id_idx on public.checkins(user_id);

create table public.mission_completions (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  program_id bigint not null references public.programs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id bigint references public.teams(id) on delete set null,
  points_awarded integer not null check (points_awarded >= 0),
  completed_at timestamptz not null default now(),
  unique (program_id, user_id)
);
create index mission_completions_festival_time_idx on public.mission_completions(festival_id, completed_at desc);
create index mission_completions_user_id_idx on public.mission_completions(user_id);
create index mission_completions_team_id_idx on public.mission_completions(team_id);

create table public.score_events (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  team_id bigint not null references public.teams(id) on delete cascade,
  points integer not null check (points <> 0),
  source text not null check (source in ('mission', 'admin_adjustment', 'bonus', 'penalty')),
  source_id bigint,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index score_events_team_time_idx on public.score_events(team_id, created_at desc);
create index score_events_festival_time_idx on public.score_events(festival_id, created_at desc);
create index score_events_created_by_idx on public.score_events(created_by);

create table public.queue_entries (
  id bigint generated always as identity primary key,
  booth_id bigint not null references public.booths(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  party_size integer not null default 1 check (party_size between 1 and 20),
  status text not null default 'waiting' check (status in ('waiting', 'called', 'served', 'cancelled', 'no_show')),
  queue_number integer not null,
  joined_at timestamptz not null default now(),
  called_at timestamptz,
  completed_at timestamptz
);
create unique index queue_entries_active_user_idx on public.queue_entries(booth_id, user_id) where status in ('waiting', 'called');
create unique index queue_entries_booth_number_idx on public.queue_entries(booth_id, queue_number);
create index queue_entries_booth_status_idx on public.queue_entries(booth_id, status, joined_at);
create index queue_entries_user_id_idx on public.queue_entries(user_id);

create table public.inventory_items (
  id bigint generated always as identity primary key,
  booth_id bigint not null references public.booths(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_at integer not null default 5 check (low_stock_at >= 0),
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create index inventory_items_booth_sort_idx on public.inventory_items(booth_id, sort_order);

create table public.announcements (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  booth_id bigint references public.booths(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  body text not null check (char_length(body) between 1 and 2000),
  priority text not null default 'normal' check (priority in ('normal', 'important', 'emergency')),
  is_published boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_festival_published_idx on public.announcements(festival_id, is_published, published_at desc);
create index announcements_booth_id_idx on public.announcements(booth_id);
create index announcements_created_by_idx on public.announcements(created_by);

create table public.reports (
  id bigint generated always as identity primary key,
  festival_id bigint not null references public.festivals(id) on delete cascade,
  booth_id bigint references public.booths(id) on delete set null,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('safety', 'facility', 'crowd', 'content', 'lost_found', 'other')),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  assignee_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_festival_status_idx on public.reports(festival_id, status, created_at desc);
create index reports_booth_id_idx on public.reports(booth_id);
create index reports_reporter_id_idx on public.reports(reporter_id);
create index reports_assignee_id_idx on public.reports(assignee_id);

create trigger inventory_items_set_updated_at before update on public.inventory_items for each row execute function private.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements for each row execute function private.set_updated_at();
create trigger reports_set_updated_at before update on public.reports for each row execute function private.set_updated_at();

alter table public.qr_codes enable row level security;
alter table public.checkins enable row level security;
alter table public.mission_completions enable row level security;
alter table public.score_events enable row level security;
alter table public.queue_entries enable row level security;
alter table public.inventory_items enable row level security;
alter table public.announcements enable row level security;
alter table public.reports enable row level security;

create policy qr_codes_admin_read on public.qr_codes for select to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy qr_codes_admin_write on public.qr_codes for all to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin']))) with check ((select private.has_festival_role(festival_id, array['owner','admin'])));

create policy checkins_own_read on public.checkins for select to authenticated using (user_id = (select auth.uid()) or (select private.has_festival_role(festival_id, array['owner','admin','staff','booth_operator'])));
create policy mission_completions_read on public.mission_completions for select to authenticated using (user_id = (select auth.uid()) or (select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy score_events_read on public.score_events for select to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff','participant'])));

create policy queue_entries_read on public.queue_entries for select to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin','staff'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));
create policy queue_entries_join on public.queue_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy queue_entries_manage on public.queue_entries for update to authenticated using (user_id = (select auth.uid()) or exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin','staff'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid()))))) with check (user_id = (select auth.uid()) or exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin','staff'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));

create policy inventory_read on public.inventory_items for select to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin','staff'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));
create policy inventory_manage on public.inventory_items for all to authenticated using (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid()))))) with check (exists (select 1 from public.booths b where b.id = booth_id and ((select private.has_festival_role(b.festival_id, array['owner','admin'])) or exists (select 1 from public.booth_members bm where bm.booth_id = b.id and bm.user_id = (select auth.uid())))));

create policy announcements_public_read on public.announcements for select to anon, authenticated using (is_published and (expires_at is null or expires_at > now()));
create policy announcements_admin_write on public.announcements for all to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));

create policy reports_create on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy reports_read on public.reports for select to authenticated using (reporter_id = (select auth.uid()) or (select private.has_festival_role(festival_id, array['owner','admin','staff'])));
create policy reports_admin_update on public.reports for update to authenticated using ((select private.has_festival_role(festival_id, array['owner','admin','staff']))) with check ((select private.has_festival_role(festival_id, array['owner','admin','staff'])));

create or replace function public.create_qr_code(target_festival_id bigint, target_booth_id bigint default null, target_program_id bigint default null, code_label text default 'QR')
returns text language plpgsql security definer set search_path = ''
as $$
declare raw_token text;
begin
  if (select auth.uid()) is null or not (select private.has_festival_role(target_festival_id, array['owner','admin'])) then raise exception 'Not authorized'; end if;
  if num_nonnulls(target_booth_id, target_program_id) <> 1 then raise exception 'Exactly one target is required'; end if;
  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.qr_codes(festival_id, booth_id, program_id, token_hash, label, created_by)
  values (target_festival_id, target_booth_id, target_program_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), code_label, (select auth.uid()));
  return raw_token;
end;
$$;
revoke all on function public.create_qr_code(bigint,bigint,bigint,text) from public, anon;
grant execute on function public.create_qr_code(bigint,bigint,bigint,text) to authenticated;

create or replace function public.redeem_qr(raw_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare actor uuid := (select auth.uid()); code_row public.qr_codes%rowtype; target_team_id bigint; awarded integer := 0;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  select * into code_row from public.qr_codes where token_hash = encode(extensions.digest(raw_code, 'sha256'), 'hex') and is_active and (expires_at is null or expires_at > now()) and (max_uses is null or use_count < max_uses) for update;
  if not found then raise exception 'Invalid or expired QR code'; end if;
  select t.id into target_team_id from public.teams t join public.team_members tm on tm.team_id = t.id where tm.user_id = actor and t.festival_id = code_row.festival_id limit 1;
  if code_row.program_id is not null then
    select points into awarded from public.programs where id = code_row.program_id and status in ('published','live');
    insert into public.mission_completions(festival_id,program_id,user_id,team_id,points_awarded) values(code_row.festival_id,code_row.program_id,actor,target_team_id,awarded);
    if target_team_id is not null and awarded > 0 then
      insert into public.score_events(festival_id,team_id,points,source,source_id,created_by) values(code_row.festival_id,target_team_id,awarded,'mission',code_row.program_id,actor);
      update public.teams set score = score + awarded where id = target_team_id;
    end if;
  else
    insert into public.checkins(festival_id,booth_id,user_id,qr_code_id) values(code_row.festival_id,code_row.booth_id,actor,code_row.id);
  end if;
  update public.qr_codes set use_count = use_count + 1 where id = code_row.id;
  return jsonb_build_object('ok',true,'type',case when code_row.program_id is null then 'checkin' else 'mission' end,'points',awarded,'team_id',target_team_id);
exception when unique_violation then raise exception 'Already completed';
end;
$$;
revoke all on function public.redeem_qr(text) from public, anon;
grant execute on function public.redeem_qr(text) to authenticated;

grant select on public.announcements to anon;
grant select, insert, update, delete on public.qr_codes, public.queue_entries, public.inventory_items, public.announcements, public.reports to authenticated;
grant select on public.checkins, public.mission_completions, public.score_events to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter publication supabase_realtime add table public.teams, public.booths, public.queue_entries, public.announcements, public.reports;
