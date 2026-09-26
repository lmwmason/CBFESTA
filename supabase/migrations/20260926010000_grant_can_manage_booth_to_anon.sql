-- The consolidated booth_ads_read policy (anon + authenticated) evaluates
-- private.can_manage_booth() for every row, including for anonymous
-- callers. Without EXECUTE, Postgres raises "permission denied for
-- function" before the function ever gets a chance to return false for a
-- null auth.uid() -- this broke the entire public homepage for logged-out
-- visitors, not just the ad banner.
grant execute on function private.can_manage_booth(bigint) to anon;
