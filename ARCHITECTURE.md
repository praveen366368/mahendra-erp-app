# Architecture

This is a distribution repository. It holds no source code. It only publishes the demo app and its update files.

## 1. The system

```
Phone (Mahendra ERP Demo app)
   |  install once: APK from the latest release
   |  every open: reads updates/demo/latest.json (main branch)
   v
latest.json  -->  names a signed update zip on a GitHub Release (tag demo-1.3.x)
                  app checks the signature and the sha256, then uses it next launch

Browser  -->  GitHub Pages site (branch gh-pages): the same demo as a web app
```

## 2. The parts

| Part | Where | Language | What it does |
|---|---|---|---|
| Download page | `README.md` on `main` | Markdown | Install steps and the "latest APK" link |
| Update manifest | `updates/demo/latest.json` on `main` | JSON | Tells the app the newest version and where to fetch it |
| APK and update zips | GitHub Releases (not in git) | Android / zip | `demo-apk-1.3.0` holds the APK; `demo-1.3.1` to `demo-1.3.6` hold update zips |
| Demo web app | `gh-pages` branch | Built JavaScript, HTML, CSS | Offline demo with sample data, served by GitHub Pages under `/mahendra-erp-app/` |
| Demo microsite | `gh-pages`, folder `demo-microsite/` | HTML | Sample branch website (one demo branch: courses, packages, gallery, offers, FAQs) |

## 3. The folder map

`main` branch:

```
README.md                 download page for the app (34 lines)
updates/demo/latest.json  update manifest (4 lines)
```

`gh-pages` branch (442 files; do not hand edit, it is build output):

```
index.html, 404.html      app shell (base path /mahendra-erp-app/)
manifest.webmanifest      installable web app settings
sw.js                     service worker, caches static files only, never API calls
merp-demo.txt             note: offline demo build, sample data, no server
assets/                   about 385 bundled JS and CSS files (largest: one 13.4 MB shared bundle)
demo-microsite/           sample branch microsite and its images
```

Other branches: `gh-pages` (besides `main`). It was not changed.

## 4. How one request travels (an update)

1. The app opens with internet and reads `updates/demo/latest.json`.
2. The file has two fields: `payload` (a JSON text) and `signature`. The payload holds `version`, `channel`, `min_native`, `notes`, `published_at`, `sha256`, `size`, `url` (the update zip) and `apk_url`.
3. The app downloads the zip named in `url`, checks the signature, and uses it on the next open (as stated in the README).
4. If the phone's native part is older than `min_native`, the app shows "Download new version" and the user installs the new APK over the old one (stated in the README).

How the signature is made and checked is not recorded in this repository.

## 5. Sign-in and roles

The demo has no password. The user picks an account (for example Super Admin, Branch Head, Counselor) and can switch role. Nothing is saved (stated in the README).

## 6. Background jobs

None here. The app downloads updates in the background on its own.

## 7. Database

None. The demo uses offline sample data.

## 8. Known shape problems (compared with the Project Standard)

- The source code of the app and the build and release scripts are not in this repository. Where they live is not recorded here. Confirm with the owner.
- `gh-pages` holds minified build output (442 files, biggest `assets/_shared-*.js` at 13.4 MB); it cannot be maintained by hand.
- No tests, no workflows, no deploy notes. How a release is published is not recorded here.
- The README on `main` is the only hand-written file. Its words were left unchanged.
- This repository is public. The site and manifest hold sample data only. Never add real student, staff or payment data.
