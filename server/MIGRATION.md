# CBFESTA data migration

## Local restore status

The October 18, 2026 snapshot in `../deploy/` has been restored into the self-hosted Supabase stack from this directory. The source is a PostgreSQL 17.6 cluster dump, so it was loaded into an isolated PostgreSQL instance, exported as table data, and restored against the running Supabase schema. No database backup or object data is committed to Git.

- At restore time, all 55 non-migration tables matched the isolated source by row count: 68 application/configuration rows, including four Auth users, four identities, three Storage buckets, and four Storage objects. The provided booth and admin test accounts both signed in successfully and were logged out; those checks add normal Auth session/audit history.
- The destination's own `auth.schema_migrations`, `realtime.schema_migrations`, and `storage.migrations` history is retained. The source-only Realtime message partitions were empty.
- All four Storage files (1,880,174 bytes total) were uploaded through the Storage API and read back with matching SHA-256 checksums. Their owner and user metadata were retained while the destination-generated object IDs and versions were kept aligned with the physical S3 objects.
- The full local stack is running at `http://127.0.0.1:18000`. It uses the optional RustFS S3-compatible Compose overlay because Docker Desktop's shared filesystem does not support the extended attributes required by the default file backend. The local `.env` and Docker volumes are ignored by Git.

The supplied snapshot is dated October 18, 2026. The user confirmed there has been no app access since then, so this is the accepted migration baseline. The old hosted project and frontend configuration have not been changed.

## Remote cutover

The restore above is a real restore into the local self-hosted destination. It is not yet running on the CBGPU deployment host. That deployment service is still being prepared, and no remote destination endpoint or shell/database access is available in this workspace. When its target is ready, deploy this `server/` folder with the required private environment variables, restore the protected snapshot into its fresh database, copy Storage objects, verify it, and only then change the frontend's `VITE_SUPABASE_URL` and public key.

Self-hosted Auth has newly generated JWT keys, so users will need to sign in again after a cutover. Configure SMTP/OAuth providers, redirect URLs, and any external integrations separately. Keep the old hosted project available until the remote target and frontend have been verified.

## Backup handling

- `../deploy/db_cluster-18-10-2026@06-08-22.backup.gz` is the cluster-level PostgreSQL dump.
- `../deploy/etathjlwpbdowsagrhza.storage.zip` contains the four Storage object files.
- The repository `.gitignore` excludes both backup formats. Keep database dumps, object archives, `.env` files, and generated keys out of commits and public deployment artifacts.
