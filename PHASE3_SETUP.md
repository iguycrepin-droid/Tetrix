# TETRIX — Phase 3: Android & Play Store Setup Guide

## Overview

Phase 3 adds:
- Google AdMob (banner, interstitial, rewarded ads)
- Remove Ads in-app purchase ($2.99)
- Revive and Score Boost rewarded ad flows
- Capacitor Android wrapper
- Play Store submission checklist

---

## Step 1 — Install Capacitor & AdMob

```bash
npm install
npx cap init TETRIX com.tetrix.game --web-dir dist
npx cap add android
```

> Note: `capacitor.config.ts` is already included — skip `cap init` if it already exists.

---

## Step 2 — AdMob Setup

### 2a. Create AdMob Account
1. Go to https://admob.google.com
2. Sign in with your Google account
3. Add a new app → Android → Enter app name "TETRIX"
4. Copy your **AdMob App ID** (format: `ca-app-pub-XXXX~NNNN`)

### 2b. Create Ad Units
In AdMob → TETRIX app → Ad units, create:
- **Banner** → name "tetrix_banner" → copy Ad Unit ID
- **Interstitial** → name "tetrix_interstitial" → copy Ad Unit ID
- **Rewarded** → name "tetrix_rewarded" → copy Ad Unit ID

### 2c. Replace Test IDs in `src/lib/admob.js`
```js
const AD_UNITS = {
  banner:        'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN',
  interstitial:  'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN',
  rewarded:      'ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN',
}
```

### 2d. Replace App ID in `capacitor.config.ts`
```ts
AdMob: {
  appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN',
}
```

### 2e. Add App ID to `android/app/src/main/AndroidManifest.xml`
After running `npx cap add android`, add inside `<application>`:
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN"/>
```

---

## Step 3 — Google Play Billing (Remove Ads IAP)

### 3a. Add In-App Purchase plugin
```bash
npm install @capacitor-community/in-app-purchases
npx cap sync android
```

### 3b. Set up product in Play Console
1. Go to https://play.google.com/console
2. Create your app (see Step 5 below)
3. Monetize → In-app products → Create product:
   - Product ID: `tetrix_remove_ads`
   - Name: Remove Ads
   - Description: Remove all banner and interstitial ads forever.
   - Price: $2.99 (Play adjusts regionally)

### 3c. Update `src/lib/iap.js`
```js
const PRODUCT_REMOVE_ADS = 'tetrix_remove_ads' // already set
```

### 3d. Add billing permission to `AndroidManifest.xml`
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### 3e. Update Supabase schema for purchases (already in schema.sql)
The `purchases` table and `profiles.ads_removed` column are already set up.

---

## Step 4 — Build the APK / AAB

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

In Android Studio:
- **Build → Generate Signed Bundle/APK**
- Choose **Android App Bundle (AAB)** for Play Store
- Create a keystore (save it safely — you need it forever):
  ```
  Key store path: tetrix-release.jks
  Password: [your password]
  Key alias: tetrix
  ```
- Build type: **Release**
- Output: `android/app/release/app-release.aab`

> ⚠️ CRITICAL: Back up your keystore file and password. If lost, you cannot update your app on Play Store.

---

## Step 5 — Play Store Submission

### 5a. Create Developer Account
1. Go to https://play.google.com/console
2. Pay $25 one-time fee
3. Complete identity verification

### 5b. Create App
- App name: TETRIX
- Default language: English
- App or Game: **Game**
- Free or paid: **Free**

### 5c. Fill Store Listing
Required:
- Short description (80 chars): "Premium block-drop arena with synthwave style, leaderboards & daily challenges"
- Full description (up to 4000 chars): describe gameplay, levels, features
- App icon: 512×512 PNG (no alpha)
- Feature graphic: 1024×500 PNG
- Screenshots: at least 2 phone screenshots (1080×1920 recommended)

### 5d. Content Rating
- Complete the IARC questionnaire (under Policy → App content)
- Tetris-style games typically get **Everyone (E)** rating

### 5e. Privacy Policy
Required (free hosting options: GitHub Pages, Notion, Google Sites).
Minimum content:
- What data you collect (email, username, scores)
- How you use it (leaderboard, auth)
- Third-party services (Supabase, AdMob, Google Play)
- Contact email

Add Privacy Policy URL under Policy → App content → Privacy policy.

### 5f. Ads Declaration
Under Policy → App content → Ads:
- Check "This app contains ads"
- AdMob auto-handles the GDPR consent banner in EU

### 5g. Upload AAB
- Production → Create new release
- Upload your `app-release.aab`
- Add release notes

### 5h. Review & Publish
First submission typically takes 1–7 days for review.

---

## Step 6 — Testing Before Release

```bash
# Run on connected device
npx cap run android

# Or open in Android Studio and use an emulator
npx cap open android
```

Use test ad IDs (already set) during development. Only switch to real IDs when releasing.

AdMob test device setup: https://support.google.com/admob/answer/9995839

---

## File Structure After Capacitor Init

```
tetrix/
  android/          ← generated by `npx cap add android`
    app/
      src/main/
        AndroidManifest.xml   ← add AdMob meta-data here
        res/                  ← icons, splash screens
  dist/             ← built web app (npx cap sync copies this)
  src/              ← React source
  capacitor.config.ts
```

---

## Phase 4 Preview (Next)

- App icon design (512×512 TETRIX logo)
- Splash screen
- Privacy Policy & Terms of Use pages in-app
- Cookie/consent banner for EU (GDPR)
- Final production build checklist
