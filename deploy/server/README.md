# CBGPU backend deployment

The CBGPU project root is [`server/`](../../server/README.md). CBFESTA uses a self-hosted Supabase Compose stack for Postgres, Auth, Storage, Realtime, and its `register`, `operations`, and `qr` Edge Functions. The frontend calls this API using only its public publishable key; never place a service-role or secret key in frontend settings.

## CBGPU server project values

| CBGPU field | Value |
| --- | --- |
| Backend type | Docker Compose |
| Git repository | `https://github.com/lmwmason/CBFESTA.git` |
| Branch | `main` |
| Root directory | `server` |
| Compose file | `docker-compose.yml` |
| HTTPS Gateway Service | `api-gw` |
| Container port | `8000` |
| Host port | Automatic allocation, or the port assigned by CBGPU |
| Access scope | Public |
| CPU | 3 cores |
| Memory | 4 GB |
| Persistent storage | 40 GB |

Use the CBGPU public domain for `SUPABASE_PUBLIC_URL`. Do not publish Postgres (`5432`), Supavisor (`6543`), Studio (`3000`), or other internal service ports. Keep the project-specific persistent volume attached across redeploys.

## Environment variables

Create a private environment from `server/.env.example`; generate the keys with `sh utils/generate-keys.sh` and `sh utils/add-new-auth-keys.sh` before the first deployment. Store the full generated environment in CBGPU's secret/environment settings and preserve it across restarts. Set these URL values for the CBGPU domain and frontend domain:

- `SUPABASE_PUBLIC_URL=https://<your-server-domain>`
- `API_EXTERNAL_URL=https://<your-server-domain>/auth/v1`
- `SITE_URL=https://<your-frontend-domain>`
- `ADDITIONAL_REDIRECT_URLS=https://<your-frontend-domain>`
- `API_GW_HTTP_PORT=<CBGPU-assigned-host-port>` (use `8000` if the platform requires a fixed host port)
- `COMPOSE_FILE=docker-compose.yml`

The remaining required settings are in `.env.example`; generate passwords and signing keys rather than using its demo values. Never commit `.env` or paste a service-role key into a frontend variable.

## Existing data

The October 18, 2026 backup has been restored and verified in the CBGPU deployment. The production frontend has also been rebuilt with the CBGPU server URL. The source snapshot is the accepted baseline because no app access occurred after October 18. Restore counts and endpoint checks are recorded in [`server/MIGRATION.md`](../../server/MIGRATION.md).
