# CBFESTA backend — CBGPU deployment root

This folder is a self-contained deployment root for the backend. It contains the official Supabase self-hosted Docker Compose stack, pinned to `self-hosted/v0.8.3`, plus CBFESTA's Edge Functions and SQL migration history.

## CBGPU project settings

Select this repository's `server/` folder as the deployment root. The deployer must support Docker Compose, multiple containers, a shared private network, secrets/environment injection, and persistent volumes. The Node.js and Python runtimes shown in the current form cannot run this stack by themselves; add a Docker Compose deployment mode in the CBGPU deployer.

Use 3 CPU cores, 4 GB RAM, and at least 40 GB of persistent SSD. Four GB is the published minimum for the complete Supabase stack, so leave optional analytics disabled and monitor memory. Preserve the `db/data` and `storage` volumes when redeploying.

The only internet-facing service should be the API gateway (`api-gw`) on container port `8000`, behind HTTPS. Do not expose Postgres/Supavisor, Studio, or internal service ports publicly. Configure the CBGPU public route to the gateway port; the host-side port can be whatever the CBGPU proxy requires.

## First startup

1. Copy `.env.example` to a private `.env` (or map those variables into CBGPU's secret store). Never commit `.env`.
2. On a trusted machine, run `sh utils/generate-keys.sh`, then `sh utils/add-new-auth-keys.sh`. Keep generated keys private and persistent across restarts; rotating the JWT signing key forces users to sign in again.
3. Set `SUPABASE_PUBLIC_URL` to the HTTPS API domain. Set `API_EXTERNAL_URL` to the same domain plus `/auth/v1`, and set `SITE_URL` / `ADDITIONAL_REDIRECT_URLS` to the frontend domain. Use the SMTP settings if the app needs email delivery.
4. Start the official Compose project with `docker compose up -d` from this folder. The API gateway is the service that CBGPU should route to.

For the CBGPU deploy flow, the selected folder is `server/`; its deploy action must run `docker compose up -d` in that folder, inject the configured secrets, keep the Compose network between services, and preserve the bind-mounted `volumes/db/data` and `volumes/storage` directories across redeploys. Route HTTPS traffic to container port `8000` on `api-gw`.

The checked-in `.env.example` contains upstream demo placeholders and is not safe for production. The key generation step is mandatory before first startup.

## CBFESTA services and schema

- `volumes/functions/register`, `operations`, and `qr` are the app's Edge Functions and are mounted into Edge Runtime by the official Compose file.
- `supabase/migrations/` contains the app's SQL migration history for future schema changes.
- `supabase/config.toml` preserves the project configuration used by the Supabase CLI.

## Moving the current data

Follow [MIGRATION.md](./MIGRATION.md) for the database restore, Storage copy, verification, and cutover sequence. Point the frontend at the CBGPU instance only after the remote restore is verified.

The October 18, 2026 database and Storage backups have been restored into the local self-hosted stack and verified. The booth and admin test accounts both signed in successfully. This local restore is not copied automatically to a CBGPU deployment; restore the protected snapshot into the CBGPU instance after it is healthy, then point the frontend to that public URL. Keep the existing hosted project running until the remote restore and cutover are verified.

## Upstream

The Compose files and operational scripts are from Supabase's official self-hosted Docker distribution, release `self-hosted/v0.8.3`. Review its changelog and back up both Postgres and Storage before upgrades; Supabase self-hosting makes the operator responsible for updates, security, and backups.

