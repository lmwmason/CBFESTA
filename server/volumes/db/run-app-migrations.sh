#!/bin/sh
set -eu

until pg_isready -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres; do
  sleep 2
done

psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
  -v ON_ERROR_STOP=1 \
  -c 'CREATE SCHEMA IF NOT EXISTS supabase_migrations' \
  -c 'CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text, created_by text, idempotency_key text, rollback text[])'

for migration in /migrations/*.sql; do
  [ -f "${migration}" ] || continue
  filename=${migration##*/}
  version=${filename%%_*}
  name=${filename#*_}
  name=${name%.sql}
  applied=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" -tAc \
    "SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '${version}'")
  if [ "${applied}" = "0" ]; then
    echo "Applying application migration ${version}"
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
      -v ON_ERROR_STOP=1 -f "${migration}"
    psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
      -v ON_ERROR_STOP=1 -c "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${version}', '${name}')"
  fi
done

psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
  -v ON_ERROR_STOP=1 \
  -c 'CREATE TABLE IF NOT EXISTS private.cbgpu_migration_state (id text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now())' \
  -c 'REVOKE ALL ON private.cbgpu_migration_state FROM PUBLIC, anon, authenticated, service_role'

restored=$(psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" -tAc \
  "SELECT count(*) FROM private.cbgpu_migration_state WHERE id = 'snapshot-2026-10-18'")
if [ "${restored}" = "0" ]; then
  echo "Restoring the October 18 application and Auth rows"
  curl -fsS --retry 5 --retry-all-errors --retry-delay 3 \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    "http://api-gw:8000/storage/v1/object/authenticated/cbfesta-migration-temp/app-data.sql" \
    -o /tmp/cbfesta-app-data.sql
  psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
    -v ON_ERROR_STOP=1 -f /tmp/cbfesta-app-data.sql
  psql -h "${POSTGRES_HOST}" -p "${POSTGRES_PORT}" -U postgres -d "${POSTGRES_DB}" \
    -v ON_ERROR_STOP=1 \
    -c "INSERT INTO private.cbgpu_migration_state (id) VALUES ('snapshot-2026-10-18')"
  rm -f /tmp/cbfesta-app-data.sql
fi

touch /tmp/app-migrations.done
exec tail -f /dev/null
