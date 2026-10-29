-- Replace manually-typed estimated_wait_minutes with the inputs needed to
-- derive it live from the actual queue: how long one turn/session takes
-- (a party doing 인생네컷 together is one session, not one per person) and
-- how many sessions the booth can run at once (e.g. two photo booths running
-- in parallel). The frontend computes ceil(waiting_parties / concurrent_capacity)
-- * session_minutes at read time instead of trusting a stale stored number.

alter table public.booths
  add column session_minutes integer not null default 5 check (session_minutes between 1 and 240),
  add column concurrent_capacity integer not null default 1 check (concurrent_capacity between 1 and 50);
