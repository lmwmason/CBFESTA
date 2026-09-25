create function public.create_festival_for_actor(actor uuid, festival_name text, festival_slug text)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare new_festival_id bigint;
begin
  if actor is null or not exists (select 1 from auth.users where id = actor) then raise exception 'Authentication required'; end if;
  if char_length(trim(festival_name)) not between 1 and 60 then raise exception 'Invalid festival name'; end if;
  if festival_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid festival slug'; end if;
  insert into public.profiles(id,display_name) values(actor,coalesce((select raw_user_meta_data->>'full_name' from auth.users where id=actor),(select split_part(email,'@',1) from auth.users where id=actor),'관리자')) on conflict(id) do nothing;
  insert into public.festivals(name,slug,created_by) values(trim(festival_name),festival_slug,actor) returning id into new_festival_id;
  insert into public.festival_members(festival_id,user_id,role) values(new_festival_id,actor,'owner');
  insert into public.categories(festival_id,name,code,sort_order,color) values
    (new_festival_id,'미션','MISSION',10,'#f52a9a'),
    (new_festival_id,'공연','STAGE',20,'#ff6a5f'),
    (new_festival_id,'먹거리','FOOD',30,'#ffc85a'),
    (new_festival_id,'전시','EXHIBITION',40,'#a989df'),
    (new_festival_id,'기타','ETC',50,'#878f91');
  return new_festival_id;
end;
$$;
revoke all on function public.create_festival_for_actor(uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_festival_for_actor(uuid,text,text) to service_role;
