# CBGPU Frontend Deploy

Connect the GitHub repository in CBGPU's Frontend Deploy form and use these values:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `./` |
| Production Branch | `main` (or the branch you deploy from) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add these build environment variables in the project's Environment Variables section:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | The public URL of the Supabase backend this frontend should use |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | That backend's publishable key |

These are compiled into the browser app. Only the publishable key belongs here; never add a database password, Supabase secret/service-role key, or signing key to frontend build variables.

The project uses React Router and `vercel.json` already rewrites routes to `index.html`. If CBGPU has an SPA fallback setting, enable it so direct links such as `/booths` and `/admin` load correctly.
