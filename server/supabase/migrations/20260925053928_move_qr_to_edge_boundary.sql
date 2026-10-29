drop function public.create_qr_code(bigint,bigint,bigint,text);
drop function public.redeem_qr(text);

create function public.create_qr_code_for_actor(actor uuid, target_festival_id bigint, target_booth_id bigint default null, target_program_id bigint default null, code_label text default 'QR')
returns text language plpgsql security definer set search_path = ''
as $$
declare raw_token text;
begin
  if actor is null or not exists (select 1 from public.festival_members where festival_id = target_festival_id and user_id = actor and role in ('owner','admin')) then raise exception 'Not authorized'; end if;
  if num_nonnulls(target_booth_id, target_program_id) <> 1 then raise exception 'Exactly one target is required'; end if;
  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.qr_codes(festival_id, booth_id, program_id, token_hash, label, created_by)
  values (target_festival_id, target_booth_id, target_program_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), code_label, actor);
  return raw_token;
end;
$$;
revoke all on function public.create_qr_code_for_actor(uuid,bigint,bigint,bigint,text) from public, anon, authenticated;
grant execute on function public.create_qr_code_for_actor(uuid,bigint,bigint,bigint,text) to service_role;

create function public.redeem_qr_for_actor(actor uuid, raw_code text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare code_row public.qr_codes%rowtype; target_team_id bigint; awarded integer := 0;
begin
  if actor is null or not exists (select 1 from auth.users where id = actor) then raise exception 'Authentication required'; end if;
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
revoke all on function public.redeem_qr_for_actor(uuid,text) from public, anon, authenticated;
grant execute on function public.redeem_qr_for_actor(uuid,text) to service_role;
