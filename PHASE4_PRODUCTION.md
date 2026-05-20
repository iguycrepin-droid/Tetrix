# TETRIX — Phase 4: Production Checklist & Android Setup

## ✅ What Phase 4 Added

- Animated splash screen (2.4 second branded intro)
- GDPR/cookie consent banner (shown once on first launch)
- Privacy Policy page (in-app, /privacy route)
- Terms of Use page (in-app, /terms route)
- "Manage Privacy" option in Settings
- App icon SVG (512×512, public/icon.svg)
- Production meta tags (OG, PWA, theme-color)
- user-select: none (prevents text selection during gameplay)

---

## 🤖 Android Manifest — Required Changes

After running `npx cap add android`, open:
`android/app/src/main/AndroidManifest.xml`

### Add inside `<manifest>` (before `<application>`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="com.android.vending.BILLING" />
```

### Add inside `<application>`:
```xml
<!-- AdMob App ID — replace with your real App ID -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN"/>

<!-- Prevent screenshots in recent apps (optional, privacy) -->
<!-- <activity android:windowSoftInputMode="adjustResize"> -->
```

### Full `<application>` attributes to set:
```xml
<application
    android:allowBackup="false"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:label="TETRIX"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="false">
```

---

## 🎨 App Icon Generation

The SVG icon is at `public/icon.svg`. To generate all required Android sizes:

### Option A — Android Studio (recommended)
1. Open project in Android Studio
2. Right-click `res` folder → New → Image Asset
3. Set foreground layer to your icon
4. Set background color to `#07071a`
5. Generate — creates all mipmap sizes automatically

### Option B — Online tool
Upload `public/icon.svg` to https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
Download and replace contents of `android/app/src/main/res/mipmap-*/`

### Required sizes:
| Folder | Size |
|---|---|
| mipmap-mdpi | 48×48 |
| mipmap-hdpi | 72×72 |
| mipmap-xhdpi | 96×96 |
| mipmap-xxhdpi | 144×144 |
| mipmap-xxxhdpi | 192×192 |
| Play Store listing | 512×512 |

---

## 🖼️ Splash Screen (Native Android)

In `android/app/src/main/res/`:

### `values/colors.xml` — add:
```xml
<color name="tetrix_bg">#07071a</color>
```

### `drawable/splash.xml` — create:
```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/tetrix_bg"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/ic_splash_logo"/>
    </item>
</layer-list>
```

Add a `ic_splash_logo.png` (your TETRIX text/logo, ~400×120px, on transparent bg) to `drawable/`.

### `values/styles.xml` — add theme:
```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="android:background">@drawable/splash</item>
</style>
```

---

## 🔒 ProGuard Rules (Release Build)

In `android/app/proguard-rules.pro`, add:
```
-keep class com.google.android.gms.** { *; }
-keep class com.android.billingclient.** { *; }
-dontwarn com.google.android.gms.**
```

---

## 📋 Play Store Submission Checklist

### Store Listing
- [ ] App name: TETRIX (30 chars max)
- [ ] Short description (80 chars): "Premium synthwave block-drop — global leaderboards, levels & boss drops"
- [ ] Full description (4000 chars max): see template below
- [ ] App icon: 512×512 PNG (from public/icon.svg)
- [ ] Feature graphic: 1024×500 PNG (design in Canva or Figma)
- [ ] Phone screenshots: minimum 2, recommended 4–8 (1080×1920)
- [ ] Content rating: complete IARC questionnaire → should be Everyone (E)

### Full Description Template:
```
TETRIX — Block Drop Arena

Drop into the synthwave grid. Stack smarter. Score higher.

FEATURES
▸ Classic 7-tetromino gameplay with premium feel
▸ Ghost piece, hold piece, and 3-piece preview
▸ 20 levels with increasing speed — then survival mode
▸ Combo chains, T-spin bonuses, back-to-back Tetris multipliers
▸ Synthwave sound effects and atmospheric music
▸ Global leaderboard — compete worldwide
▸ Weekly leaderboard — fresh competition every Monday
▸ Rank system: Bronze → Silver → Gold → Platinum → Diamond
▸ Personal stats dashboard
▸ Rewarded ads: watch voluntarily to Revive or get a Score Boost
▸ Remove Ads — one-time purchase, synced to your account

CONTROLS
Swipe or use on-screen buttons. Full touch controls built for mobile.

SIGN IN
Play as a guest or create a free account to save scores and join the global leaderboard across devices.
```

### Technical
- [ ] Upload signed AAB (not APK) for Play Store
- [ ] Target SDK: 34 (Android 14)
- [ ] Min SDK: 24 (Android 7.0) — covers 95%+ of devices
- [ ] Declare ads: Policy → App content → Ads → "Contains ads"
- [ ] Privacy Policy URL: your hosted privacy policy page
- [ ] Data safety form: complete (collects email, gameplay data, purchase info)

---

## 🔑 Data Safety Form (Play Console)

Under Policy → Data safety, declare:

| Data type | Collected | Shared | Required |
|---|---|---|---|
| Email address | Yes | No | Yes (account) |
| User ID | Yes | No | Yes (account) |
| Game activity (scores) | Yes | Yes (leaderboard) | No |
| Purchase history | Yes | No | No |
| Device/other IDs | Yes (AdMob) | Yes (AdMob) | No |

Check "Data is encrypted in transit" ✓
Check "Users can request deletion" ✓

---

## 🚀 Final Build Commands

```bash
# 1. Set real AdMob IDs in src/lib/admob.js
# 2. Set real AdMob App ID in capacitor.config.ts
# 3. Set your contact emails in PrivacyPolicyPage.jsx and TermsOfUsePage.jsx

# 4. Build
npm run build
npx cap sync android

# 5. Open Android Studio
npx cap open android

# 6. In Android Studio:
#    Build → Generate Signed Bundle/APK → Android App Bundle
#    Use your release keystore
#    Build variant: release

# 7. Upload android/app/release/app-release.aab to Play Console
```

---

## 📱 Testing Before Release

```bash
# Test on device
npx cap run android

# Enable USB debugging on your Android phone
# Connect via USB → trust computer → run above command
```

Check:
- [ ] Splash screen shows and fades correctly
- [ ] Consent banner appears on first launch only
- [ ] Ads show (use test IDs during testing)
- [ ] Remove Ads purchase flow works
- [ ] Restore purchases works
- [ ] Leaderboard loads
- [ ] Google Sign-In works
- [ ] Game plays smoothly at all levels
- [ ] Sound effects work
- [ ] Pause/resume works when app goes to background

---

## 🎉 You're Done!

Phase 1 ✅ Core game engine
Phase 2 ✅ Auth + leaderboard + profiles
Phase 3 ✅ AdMob + IAP + Store
Phase 4 ✅ Splash + consent + legal + production build

Submit to Play Store and wait 1–7 days for review.
