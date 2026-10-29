# Deployment layout

- `frontend/` documents the Git-connected static-site build settings for CBGPU Frontend Deploy (Vercel-style).
- `server/` documents the separate Supabase backend, required server resources, and the full-data migration requirements.

The app source stays in `src/` and `supabase/`. The frontend platform builds the Vite app from Git; it is not containerized.

