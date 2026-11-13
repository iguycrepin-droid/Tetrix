# TETRIX

Synthwave block-drop game. React 18, Vite 5, Supabase, and Capacitor 6 for Android. Web builds deploy to Vercel. The Android project is generated on your machine and is not in this repo.

You can play with no environment variables. Accounts, leaderboards, and purchases stay off until Supabase is configured, and the menu says so.

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # game engine unit tests
npm run lint
npm run build        # web build, includes the PWA service worker
npm run preview
npm run cap:build    # web build WITHOUT the service worker, then cap sync
```

`cap:build` sets `CAPACITOR=1` so Vite does not emit a service worker. A service worker inside the Capacitor WebView fights `cap sync`.

## Environment

```bash
cp .env.example .env.local
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vite | Project URL. Blank = guest mode. |
| `VITE_SUPABASE_ANON_KEY` | Vite | Anon key. Blank = guest mode. |
| `VITE_ADMOB_USE_LIVE` | Vite | `true` in production to use your real ad units. |
| `VITE_ADMOB_BANNER_ID` | Vite | Live banner unit. |
| `VITE_ADMOB_INTERSTITIAL_ID` | Vite | Live interstitial unit. |
| `VITE_ADMOB_REWARDED_ID` | Vite | Live rewarded unit. |
| `ADMOB_USE_LIVE` | shell, `cap sync` | `true` to bake your real AdMob app id into the native config. |
| `ADMOB_APP_ID` | shell, `cap sync` | Live AdMob app id (`ca-app-pub-…~…`). |

Development, and any build that does not set the live flags, uses [Google's sample ad units](https://developers.google.com/admob/android/test-ads). Do not commit real keys.

## Supabase

1. Create a project at https://supabase.com.
2. In the SQL editor, run `supabase_schema.sql` once. The same script is in `supabase/migrations/20261113120000_security_and_weekly.sql` for the Supabase CLI.
3. Authentication → Providers: Email, and Google if you want it.
4. Authentication → URL configuration: site URL and redirect URL set to your Vercel (or local) origin.

What the schema enforces:

- Clients can insert their own profile and can update only `username` and `avatar_id`.
- A trigger ignores client writes to `ads_removed`, best score, level, games, lines, and playtime.
- Scores are inserted only by `submit_score` (security definer). It checks plausibility and is idempotent on `client_game_id`.
- Purchases are inserted only by `record_verified_purchase`, which is granted to `service_role`.
- Profiles, scores, and purchases can be deleted by their owner, and they cascade from `auth.users`.
- `weekly_leaderboard` is the current ISO week (Monday 00:00 UTC) with one best score per player.

### Edge Functions

Deploy from this repo (the CLI uses the service role on the server; do not put that key in Vite). Run `supabase link` first and set `project_id` in `supabase/config.toml` to your project ref:

```bash
supabase functions deploy submit-score
supabase functions deploy verify-purchase
supabase functions deploy delete-user
```

`submit-score` calls `submit_score` with the player's JWT. If the function is not deployed yet, the client falls back to the same RPC. Both paths share the plausibility checks.

`verify-purchase` checks a Google Play product token, then calls `record_verified_purchase`. Secrets:

```bash
supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
supabase secrets set ANDROID_PACKAGE_NAME=com.tetrix.game
```

The Play Console service account needs the Android Publisher API. `ALLOW_DEV_PURCHASES=true` accepts tokens that start with `dev:` and must never be set on production.

`delete-user` deletes the auth user. Profile, scores, and purchases cascade.

Play product id: `tetrix_remove_ads` (managed product, non-consumable).

## Web

```bash
npm run dev
```

Guest mode needs nothing else. Sign-in, leaderboards, and the store need the two `VITE_SUPABASE_*` values and the SQL above.

Vercel: set the same `VITE_` variables. `vercel.json` rewrites every path to `index.html`. The production build registers a Workbox service worker (vite-plugin-pwa) so the web app is installable and can open offline after the first visit. API calls still need a network.

## Android

Do this on a machine with Android Studio and JDK 17. Do not commit `android/`.

```bash
npm install
npx cap add android
```

Then, in `android/app/src/main/AndroidManifest.xml`:

- `android.permission.INTERNET`
- `com.android.vending.BILLING`
- Inside `<application>`, the AdMob app id meta-data. Use the test id `ca-app-pub-3940256099942544~3347511713` until you pass `ADMOB_USE_LIVE=true` and `ADMOB_APP_ID` into `npx cap sync`. `capacitor.config.ts` reads those variables when the native project is synced.

```bash
npm run cap:build
npx cap open android
```

Billing uses `@capgo/native-purchases` 6.0.42, the last release that matches Capacitor 6. `@capacitor-community/in-app-purchases` is not on npm. This plugin's `restorePurchases()` consumes acknowledged one-time products, so the app does not call it. Restore re-reads `profiles.ads_removed` for the signed-in account after a verified purchase. Listing Play tokens on a fresh account needs `@capgo/native-purchases` v8, which requires Capacitor 8. That upgrade is intentionally not in this change.

## Gameplay notes

- Pieces come from a 7-bag.
- T-spins use the 3-corner rule. A zero-distance hard drop still counts when the last move was a rotation. Scores: full 400/800/1200/1600 × level, mini 100/200/400 × level, plus the existing combo and back-to-back bonuses.
- Rewarded boost is 1.25×, or 2.5× when Remove Ads is verified. The copy in all nine languages matches those rates.
- Ghost piece, hard-drop confirm, combo counter, and line-clear flash are on only when Remove Ads is verified and the setting is enabled. Music is a small Web Audio loop and follows the music toggle and volume. Sound effects were already wired.
- The daily goal is one local target per UTC day (lines, score, a Tetris, or a T-spin). It is not a separate mode.
- Ads load only after the player accepts advertising in the consent prompt, and not at all when they choose essential only or when ads are removed. Banner and interstitial stay off for Remove Ads owners. Rewarded ads stay available to them if they accepted advertising.

## Follow-ups (not in this change)

- Vite 5 → 8, Capacitor 6 → 8, React 18 → 19.
- With Capacitor 8, move to `@capgo/native-purchases` v8 and use `getPurchases()` for a real Play restore.
- Re-run `npm audit` after those upgrades. Transitive fixes that need a major bump were left alone.
