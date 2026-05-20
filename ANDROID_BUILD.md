# TETRIX — Android APK & AAB Build Guide

## Prerequisites
- Android Studio installed: https://developer.android.com/studio
- JDK 17 (bundled with Android Studio)
- Node.js 18+

---

## Step 1 — Initialize Capacitor Android

Run once in the project root:

```bash
npm install
npx cap add android
```

This generates the `android/` folder.

---

## Step 2 — Patch AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml`

Add inside `<manifest>` tag (before `<application>`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="com.android.vending.BILLING" />
```

Add inside `<application>` tag:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-7225653287350149~8772769864"/>
```

---

## Step 3 — Set app icon

In Android Studio:
1. Right-click `android/app/src/main/res` → New → Image Asset
2. Icon Type: Launcher Icons (Adaptive and Legacy)
3. Foreground Layer: Image → select `public/icon.svg`
4. Background Color: `#07071a`
5. Click Next → Finish

---

## Step 4 — Build & sync

```bash
npm run build
npx cap sync android
npx cap open android
```

---

## Step 5 — Test on device (Debug APK)

In Android Studio:
1. Enable USB Debugging on your Android phone
2. Connect via USB
3. Click ▶ Run (green play button)
4. Select your device

Test:
- Real AdMob ads load (banner on menu, interstitial after 4th game over)
- Remove Ads IAP flow works
- Touch controls feel good
- All screens render correctly on your phone size

---

## Step 6 — Create your Release Keystore (ONCE ONLY)

In Android Studio: Build → Generate Signed Bundle/APK → Create new keystore

```
Key store path: tetrix-release.jks   ← save this file somewhere SAFE
Password:       [strong password]    ← write this down
Key alias:      tetrix
Key password:   [same or different]
Validity:       25 years
First/Last name: TigerSoulFX
```

⚠️  BACK UP tetrix-release.jks immediately to Google Drive or similar.
    If you lose it, you can NEVER update the app on Play Store.

---

## Step 7 — Build Release AAB (for Play Store)

Build → Generate Signed Bundle/APK:
1. Android App Bundle ← choose this for Play Store
2. Select your keystore → enter passwords
3. Build Variant: release
4. Click Finish

Output: `android/app/release/app-release.aab`

---

## Step 8 — Build Release APK (for direct install / testing)

Build → Generate Signed Bundle/APK:
1. APK ← choose this for direct install
2. Same keystore
3. Build Variant: release
4. Click Finish

Output: `android/app/release/app-release.apk`

Install directly on phone:
```bash
adb install android/app/release/app-release.apk
```

---

## Play Store Submission

1. play.google.com/console → Pay $25 → Create app
2. App name: TETRIX
3. Store listing:
   - Short description (80 chars): Premium synthwave block-drop — global leaderboards, levels & combos
   - Full description: see below
   - Icon: 512×512 PNG (export from public/icon.svg)
   - Feature graphic: 1024×500 PNG
   - Screenshots: 4+ at 1080×1920
4. Content rating: Everyone (E)
5. Privacy Policy URL: https://tetrix-two.vercel.app/privacy
6. Ads declaration: Policy → App content → Ads → "Contains ads"
7. Data safety: email, user ID, game activity, purchase history, device IDs
8. Upload app-release.aab → Submit

---

## Full Description (copy-paste for Play Store)

TETRIX — Block Drop Arena

Drop into the synthwave grid. Stack smarter. Score higher.

FEATURES
▸ Classic 7-tetromino gameplay with premium feel
▸ Ghost piece, hold piece, and 3-piece preview
▸ 20 levels with increasing speed — then survival mode
▸ Combo chains, T-spin bonuses, back-to-back Tetris multipliers
▸ Synthwave sound effects
▸ Global leaderboard — compete worldwide
▸ Weekly leaderboard — fresh competition every Monday
▸ Rank system: Bronze → Silver → Gold → Platinum → Diamond
▸ 9 animal avatars with unique symbols
▸ Personal stats dashboard
▸ Rewarded ads: watch to Revive or get a Score Boost
▸ Remove Ads — one-time purchase, synced to your account
▸ Available in 9 languages: English, Arabic, French, Hindi, Indonesian, Portuguese, Russian, Spanish, Turkish

CONTROLS
On-screen touch buttons. Full mobile controls built for phone and tablet.

SIGN IN
Play as a guest or create a free account to save scores and join the global leaderboard.

Developer: TigerSoulFX
Contact: tigersoulfx@gmail.com
