# Setting Up GitHub Secrets for Chiko Browser

The GitHub Actions workflow needs 4 secrets to sign the release AAB.  
Set them at: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

---

## Step 1 — Create a signing keystore (once)

Run this on your local machine (requires Java installed):

```bash
keytool -genkey -v \
  -keystore chiko-release.keystore \
  -alias chiko \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Chiko Browser, OU=Mobile, O=YourCompany, L=City, S=State, C=US"
```

You'll be prompted to create a **store password** and a **key password**. Save them — you'll need both below.

> **Important:** Back up `chiko-release.keystore` somewhere safe (cloud storage, password manager). If you lose it, you can never update your app on Google Play.

---

## Step 2 — Convert keystore to base64

```bash
# macOS / Linux
base64 -i chiko-release.keystore | pbcopy   # copies to clipboard (macOS)
base64 -i chiko-release.keystore            # print to terminal (Linux)

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("chiko-release.keystore")) | Set-Clipboard
```

---

## Step 3 — Add the 4 secrets to GitHub

| Secret name | Value |
|---|---|
| `KEYSTORE_BASE64` | The base64 string from Step 2 |
| `STORE_PASSWORD` | The store password you chose in Step 1 |
| `KEY_ALIAS` | `chiko` (or whatever alias you used) |
| `KEY_PASSWORD` | The key password you chose in Step 1 |

---

## Step 4 — Trigger the build

The workflow runs automatically on every push to `main` that touches `artifacts/mobile-browser/`.

To trigger it manually (and set a custom version):
1. Go to **Actions → Build Chiko Browser (Android AAB)**
2. Click **Run workflow**
3. Fill in the version name (e.g. `1.0.0`) and version code (e.g. `1`)
4. Click **Run workflow**

---

## Step 5 — Download the AAB

Once the workflow finishes (~5–8 minutes):
1. Open the completed workflow run
2. Scroll to **Artifacts** at the bottom
3. Download **chiko-browser-release-aab**

Upload `app-release.aab` to the [Google Play Console](https://play.google.com/console).

---

## Version code rules (Google Play)

Every release uploaded to Google Play **must have a higher `versionCode`** than the previous one.  
Use the `workflow_dispatch` inputs to set these manually, or automate using `${{ github.run_number }}`.
