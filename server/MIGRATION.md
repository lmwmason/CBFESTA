# CBFESTA data migration

## CBGPU restore status

The October 18, 2026 snapshot in `../deploy/` has been restored to the CBGPU self-hosted Supabase stack at `https://cbfesta.server.cbgpu.com`. The source is a PostgreSQL 17.6 cluster dump, so app/Auth data was extracted from an isolated PostgreSQL instance and applied to the deployed schema. No database backup, object archive, or service-role key is committed to Git.

- The restore job reported matching row counts for all 15 public tables containing data in the snapshot; Auth admin API returns all four users, and the `booths` and `profiles` REST endpoints return HTTP 200. Destination-owned Supabase migration histories were retained.
- All four Storage objects were copied into the original buckets (`avatars`, `booth-assets`, and `team-logos`). Public reads return HTTP 200 with the expected file sizes: 87,037; 1,691,613; 14,487; and 87,037 bytes (1,880,174 bytes total).
- The temporary private staging bucket used to deliver the SQL dump was removed after the restore. The original backup files remain local under `../deploy/` and are excluded from Git.
- CBGPU frontend project `cbfesta.front.cbgpu.com` now builds with `VITE_SUPABASE_URL=https://cbfesta.server.cbgpu.com` and the destination's public anon key. The production deployment completed successfully; its published JS bundle contains the new API domain and no longer contains the previous hosted Supabase domain.
- Auth health and app REST endpoints were checked after deployment. Users may need to sign in again because the self-hosted Auth instance has its own signing keys. Email confirmation is disabled for this deployment.

The supplied snapshot is dated October 18, 2026. The user confirmed there has been no app access since then, so it is the accepted migration baseline.

## Backup handling

- `../deploy/db_cluster-18-10-2026@06-08-22.backup.gz` is the cluster-level PostgreSQL dump.
- `../deploy/etathjlwpbdowsagrhza.storage.zip` contains the four Storage object files.
- The repository `.gitignore` excludes both backup formats. Keep database dumps, object archives, `.env` files, and generated keys out of commits and public deployment artifacts.
