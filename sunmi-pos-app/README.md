# Lab Parfumo POS (SUNMI wrapper app)

A thin Android app that opens the Lab Parfumo web app in a full-screen WebView and
adds one capability the browser can't do: **print the receipt to the SUNMI built-in
thermal printer**.

How it works:
- The app loads `https://lab-parfumo-central.vercel.app/login?next=/my` (change in
  `app/build.gradle` → `APP_URL`).
- It injects `window.SunmiBridge` into the page. On the receipt page, when that bridge
  exists, a **"พิมพ์สลิป (เครื่องนี้)"** button appears. Pressing it renders the on-screen
  receipt to a PNG and calls `SunmiBridge.printImage(base64)`.
- The app decodes the image, scales it to the 58 mm head (384 dots), prints it, and
  cuts the paper.

Nothing changes for normal browsers — the button only shows inside this app.

---

## Build the APK (on a computer with Android Studio)

You need **Android Studio** (free). No coding required — just build.

1. Install Android Studio: https://developer.android.com/studio
2. **File → Open…** → choose this `sunmi-pos-app` folder → wait for Gradle sync.
   - If it asks to create the Gradle wrapper, say yes. Or run once in a terminal:
     `gradle wrapper` (needs Gradle installed) — Android Studio usually handles this.
3. (Optional) Change the URL: open `app/build.gradle`, edit the `APP_URL` line.
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. When it finishes, click **locate** — the file is
   `app/build/outputs/apk/debug/app-debug.apk`.

## Install on the SUNMI V3

Pick one:
- **USB:** connect the SUNMI to the computer, enable *Developer options → USB debugging*
  on the device, then in Android Studio press **Run ▶** (it installs + launches), or
  `adb install app-debug.apk`.
- **No cable:** copy `app-debug.apk` to the device (Google Drive / LINE / USB drive),
  open it with the Files app, allow "install unknown apps", install.

Open **Lab Parfumo POS**, log in, make/open a bill → open its receipt → press
**พิมพ์สลิป (เครื่องนี้)**.

---

## ถ้า SDK โหลดไม่ได้ (com.sunmi:printerlibrary)

If Gradle can't resolve `com.sunmi:printerlibrary:1.0.18`:
- Make sure `settings.gradle` keeps the repos `maven.sunmi.com` and `jitpack.io`
  (already added).
- Alternative version to try: `1.0.15` or `1.0.13`.
- Last resort: download SUNMI's `printerlibrary` AAR from their developer portal
  (docs.sunmi.com → Print SDK) and drop it in `app/libs/`, then use
  `implementation files('libs/printerlibrary.aar')`.

## Notes
- 58 mm head = 384 dots (set in `MainActivity.printWidth`). For an 80 mm head use 576.
- `cutPaper` is wrapped in try/catch — models without an auto-cutter just skip it.
- Camera (barcode scanner) works: the app auto-grants the WebView camera permission.
- Login/session persists (WebView keeps cookies).
