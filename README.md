# CBFESTA

[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Storage-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-D22128?logo=apache&logoColor=white)](./LICENSE)

CBFESTA is an open-source platform for running a school (or any single-site)
festival end to end: booth discovery and queueing, a live schedule, team and
individual leaderboards, announcements, QR check-in, and a booth "ad" economy
funded by visitor ratings — plus the admin and booth-operator consoles needed
to run all of it on the day of the event.

It ships as a single React web app with three surfaces gated by role:

- **Student site** — browse booths, join queues remotely, check a live
  schedule, rate booths, see team/individual/booth rankings, and manage a
  personal profile and team.
- **Booth operator console** — a single-page "booth desk" for checking
  visitors in, running the queue, managing inventory, and buying a homepage
  ad slot with coins earned from ratings.
- **Admin console** — festival settings, categories, booths, schedule,
  announcements, teams (including auto-balancing students into teams),
  permissions, reports/issues, and the full rankings view.

The backend is entirely Supabase: Postgres with row-level security for every
table, a handful of `SECURITY DEFINER` Postgres functions for the operations
that need to cross RLS boundaries safely (joining a queue, redeeming a QR
code, auto-assigning teams, buying an ad slot), and a small set of Edge
Functions for the pieces that need a service-role key (account registration,
QR issuing/redemption, queue operations).

## Tech stack

- [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
- [react-router-dom](https://reactrouter.com/) for routing
- [Supabase](https://supabase.com/) — Postgres, Auth, Storage, Edge Functions, Realtime
- [lucide-react](https://lucide.dev/) for icons, [react-markdown](https://github.com/remarkjs/react-markdown) for booth descriptions
- [qrcode](https://github.com/soldair/node-qrcode) / [qr-scanner](https://github.com/nimiq/qr-scanner) for QR generation and scanning

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the full list of
third-party dependencies and their licenses.

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (the free tier is enough to run this)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) if you want to deploy the Edge Functions

### 1. Clone and install

```bash
git clone https://github.com/lmwmason/CBFESTA.git
cd CBFESTA
npm install
```

### 2. Set up the database

Open the SQL editor in your Supabase project and run
[`supabase/schema.sql`](./supabase/schema.sql) once. It is the entire
migration history concatenated into a single script, so it takes a brand new
Supabase project to the current schema in one step: tables, RLS policies,
Postgres functions, triggers, storage buckets and their policies.

If you'd rather manage schema changes incrementally with the Supabase CLI
instead of a single script, the original migrations are in
`supabase/migrations/` and can be applied with `supabase db push`.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your project's URL and publishable (anon) key, both available under
Project Settings → API in the Supabase dashboard:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

### 4. Deploy the Edge Functions

The app calls three Edge Functions for operations that require a service-role
key or should not run with the caller's own RLS-limited session:

| Function     | Purpose                                                        |
| ------------ | --------------------------------------------------------------- |
| `register`   | Creates an account from an id + password + student number pair |
| `operations` | Queue actions (e.g. joining a queue with companions)            |
| `qr`         | Issues and redeems check-in QR codes                            |

```bash
supabase functions deploy register --no-verify-jwt
supabase functions deploy operations
supabase functions deploy qr
```

### 5. Run it

```bash
npm run dev
```

### Roles

New accounts start as participants. Admins grant additional roles — admin,
staff, booth operator — to specific accounts from the admin Permissions
page as needed.

To get a first admin on a fresh deployment, sign up with student number
`9999` (reserved for admin) or `9998` (reserved for booth operator). Change
the reserved numbers in `private.enroll_new_user_in_current_festival()` in
the schema if you don't want to use these defaults.

## Project structure

```
src/
  App.tsx                 Student homepage (hero, rankings, ads, booth list)
  RoleDashboards.tsx       Admin and booth-operator dashboard shells
  routes/AppRoutes.tsx     Route table and most student-facing pages
  components/              Shared shells (AdminShell, BoothShell), nav, footer
  features/
    admin/                 Admin pages (booths, schedule, teams, rankings, ...)
    auth/                  Auth context/provider, sign-in sheet
    booth/                 Booth-operator pages (queue, inventory, settings, QR display)
    account/               Account settings (name, password, avatar)
    team/                  Student-facing "my team" page
  lib/supabase/            Supabase client, generated types, and the services.ts
                           data-access layer (every Supabase call lives here)
supabase/
  migrations/              Chronological migration history (source of truth)
  schema.sql               The same history, concatenated for one-shot setup
  functions/                Edge Functions (register, operations, qr)
```

## Security model

Every table has row-level security enabled. Cross-cutting operations that a
plain RLS policy can't express safely (joining a queue on someone else's
behalf, auto-balancing students into teams, letting any team member edit
team branding, buying an ad slot and deducting currency atomically) go
through `SECURITY DEFINER` Postgres functions in the `public` or `private`
schema, each of which re-checks the caller's permissions internally before
doing anything — the RLS bypass is scoped to the function body, not handed
to the caller.

If you fork this project and add your own `SECURITY DEFINER` functions,
remember that `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC` by default;
either use `CREATE OR REPLACE FUNCTION` on an unchanged signature (which
preserves existing grants) or explicitly `REVOKE ... FROM PUBLIC` and
`GRANT` only to the roles that should call it.

## License

Licensed under the [Apache License 2.0](./LICENSE).
