create or replace function public.create_qr_code_for_actor(actor uuid, target_festival_id bigint, target_booth_id bigint default null, target_program_id bigint default null, code_label text default 'QR')
returns text language plpgsql security definer set search_path = '' as $$
declare raw_token text;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if num_nonnulls(target_booth_id, target_program_id) <> 1 then raise exception 'Exactly one target is required'; end if;
  if target_booth_id is not null and not (
    exists (select 1 from public.festival_members where festival_id = target_festival_id and user_id = actor and role in ('owner','admin','staff'))
    or exists (select 1 from public.booth_members where booth_id = target_booth_id and user_id = actor)
  ) then raise exception 'Not authorized'; end if;
  if target_program_id is not null and not exists (select 1 from public.festival_members where festival_id = target_festival_id and user_id = actor and role in ('owner','admin')) then raise exception 'Not authorized'; end if;
  raw_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.qr_codes(festival_id, booth_id, program_id, token_hash, label, created_by) values (target_festival_id, target_booth_id, target_program_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), code_label, actor);
  return raw_token;
end;
$$;
