# Building Chiko Browser for Android

## Prerequisites

Install these on your local machine:

- **Android Studio** — [Download](https://developer.android.com/studio)
- **Java 17+** — comes bundled with Android Studio
- **Node.js 18+** and **pnpm**

---

## Step 1 — Build the web assets

Run this once (and every time you change the app's code):

```bash
cd artifacts/mobile-browser
pnpm run build:android
```

This builds the React app into `android-dist/` and syncs it into the Android project.

---

## Step 2 — Open in Android Studio

```bash
pnpm run android:open
```

Or open Android Studio manually and choose **Open an existing project**, then select:
```
artifacts/mobile-browser/android/
```

---

## Step 3 — Generate a signing keystore (first time only)

Android apps must be signed before distribution. Run this in a terminal:

```bash
keytool -genkey -v \
  -keystore chiko-release.keystore \
  -alias chiko \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Save `chiko-release.keystore` somewhere safe — you need the same keystore for every update.

---

## Step 4 — Build the APK (debug, for testing)

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 5 — Build the release APK + AAB (for Google Play)

### Configure signing

Edit `android/app/build.gradle` and add inside the `android {}` block:

```groovy
signingConfigs {
    release {
        storeFile file('../../../../chiko-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'chiko'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Build signed APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Build AAB (required for Google Play)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## App Details

| Field | Value |
|---|---|
| App name | Chiko Browser |
| Package ID | com.chikobrowser.app |
| Min SDK | Android 7.0 (API 24) |
| Target SDK | Android 14 (API 34) |
| Version | 1.0 |

---

## Updating the app

Whenever you change the React code:

```bash
pnpm run build:android   # rebuild web assets + sync
```

Then rebuild in Android Studio or via `./gradlew assembleRelease`.

---

## App Icon

The icon source file is at `assets/icon.png` (512×512).  
To regenerate all icon sizes after editing the source:

```bash
npx @capacitor/assets generate --android
```

---

## Splash Screen

Splash screens are in `android/app/src/main/res/drawable-port-*/splash.png`.  
The background color is `#0a1628` (deep navy).  
Duration is set to 2 seconds in `capacitor.config.ts`.
