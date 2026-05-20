# TETRIX — Phase 2 Setup Guide

## Stack
- React + Vite + React Router
- Supabase (Auth + PostgreSQL)
- Deployed on Vercel

---

## 1. Supabase Setup

1. Go to https://supabase.com and create a new project
2. Open **SQL Editor** and run `supabase_schema.sql` (all at once)
3. Go to **Authentication → Providers** and enable:
   - Email (on by default)
   - Google OAuth (add Client ID + Secret from Google Cloud Console)
4. Under **Authentication → URL Configuration**, set:
   - Site URL: `https://your-vercel-app.vercel.app`
   - Redirect URLs: `https://your-vercel-app.vercel.app`

---

## 2. Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in your Supabase credentials
cp .env.example .env.local

# Edit .env.local:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Start dev server
npm run dev
```

---

## 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

Or connect your GitHub repo in Vercel dashboard for auto-deploys.

---

## 4. Google OAuth Setup (optional but recommended)

1. Go to https://console.cloud.google.com
2. Create a new project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI:
   `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy Client ID + Secret into Supabase Auth → Google provider

---

## Project Structure

```
src/
  components/
    UI.jsx          — Shared components (Avatar, Button, Card, etc.)
    GameOverModal.jsx — Post-game score submission modal
  hooks/
    useAuth.jsx     — Auth context + profile management
    useScores.js    — Score submission + leaderboard queries
  lib/
    supabase.js     — Supabase client
  pages/
    AuthPages.jsx   — Login, Register, ForgotPassword
    MenuPage.jsx    — Main menu with player card
    GamePage.jsx    — Full game with Tetris engine
    LeaderboardPage.jsx — Global/Weekly/Personal leaderboards
    ProfilePage.jsx — Profile editing + stats + rank progress
    SettingsPage.jsx — Audio, gameplay, display settings
  App.jsx           — Router
  main.jsx          — Entry point
```

---

## What's Next — Phase 3

- Google AdMob integration (banner + interstitial + rewarded)
- "Remove Ads" IAP via Google Play Billing
- Store screen
- Capacitor wrapping for Android APK
