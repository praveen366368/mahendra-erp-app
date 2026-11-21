# Mahendra ERP Demo — Android app

## At a glance

| | |
|---|---|
| **What it is** | The public download page and update files for the Mahendra ERP Demo Android app (sample data only). A web copy of the demo sits on the `gh-pages` branch. |
| **Who uses it** | Mahendra staff and prospects who install the demo app on an Android phone |
| **Backend** | None. Static files only (GitHub Releases and GitHub Pages) |
| **Frontend** | The demo web app is built JavaScript on the `gh-pages` branch. The source code is not in this repository |
| **Android app** | Mahendra ERP Demo (the APK is a release download, not stored in git) |
| **Database** | None. The demo uses offline sample data |
| **Port** | None |
| **Run it** | Nothing to run here. Open the GitHub Pages site, or install the APK from the latest release |
| **Test it** | No tests in this repository |
| **Owner** | Mahendra |

## Documents

| Read this | To learn |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | The three places things live (main, gh-pages, releases) and how an update reaches a phone |
| [CHANGELOG.md](CHANGELOG.md) | Demo versions 1.3.0 to 1.3.6 |
| [CLAUDE.md](CLAUDE.md) | Rules for AI coding tools |

A new developer reads this page, then ARCHITECTURE.md, then DATABASE.md. (There is no DATABASE.md here: the repository has no database.)

---

**Install once. Updates arrive by themselves — no reinstall.**

## ⬇️ Download

### [Download Mahendra ERP Demo (Android)](https://github.com/praveen366368/mahendra-erp-app/releases/latest/download/MahendraERP-Demo.apk)

This link always gives the newest app.

## How to install (one time)

1. Open the link above on your Android phone and download the file `MahendraERP-Demo.apk`.
2. Tap the downloaded file. If the phone asks, allow **"Install unknown apps"** for your browser or file manager.
3. Tap **Install**, then **Open**.
4. Pick any account (Super Admin, Branch Head, Counselor …) — no password needed.
   Use **Switch role** at the top to see the app as someone else.

## Updates

You do **not** need to download the app again. When a new version is published, the app downloads it
in the background the next time it is opened with internet, and uses it the next time you open the app.
The app's version is shown at the bottom of the account list.

Only in the rare case that the Android part of the app changes will the app show a
**"Download new version"** button — tap it once and install over the old app (your app stays installed).

## What this is

- A **demo** of Mahendra ERP (CRM + DCC) with **sample data only** — no real students, leads or payments.
- Works **offline**; nothing you change is saved.
- Every update is digitally signed; the app refuses updates that are not signed by Mahendra.

This repository contains only the app download and its update files, not the source code.
