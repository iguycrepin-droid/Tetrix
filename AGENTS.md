# AGENTS.md

## Cursor Cloud specific instructions

React + Vite + Capacitor Tetris game ("Tetrix").

- Install: `npm install`. Run (dev): `npm run dev` (Vite, default port `5173`; pass `-- --port <n> --host` to fix the port). Build: `npm run build`. No lint or test scripts are configured.
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — `src/lib/supabase.js` throws at import time if either is missing, which blank-screens the whole app. Put them in `.env.local` (see README). Placeholder values are enough to load the app because routes are NOT auth-guarded: `/menu` and `/game` work offline, and core gameplay (the Tetris engine) is fully client-side. Only auth, leaderboard, profile, and store need a real Supabase project (run `supabase_schema.sql` there).
- `@capacitor-community/in-app-purchases` (imported dynamically in `src/lib/iap.js`) is a native-only plugin that is not published to npm. `vite.config.js` aliases it to `src/lib/iap-web-stub.js` so the dev server and web build resolve it; do not remove that alias/stub.
- Android build: `npm run cap:build` (needs the Capacitor Android toolchain).
