-- join_queue_for_actor already checked target_booth.queue_enabled, but the
-- column was never created, so every queue-join attempt failed with
-- "record \"target_booth\" has no field \"queue_enabled\"". Add the column
-- (defaulting to enabled, so existing booths keep working) instead of
-- removing the intended check, since booth operators being able to pause
-- queueing independently of the booth's open/paused/closed status is useful.

alter table public.booths
  add column queue_enabled boolean not null default true;
