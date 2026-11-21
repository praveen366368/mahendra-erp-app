# Rules for AI coding tools in this repository

## State of the project

A public distribution repository: a download page, an update manifest and (on `gh-pages`) a built demo web app. There is no source code, so there are no run, test or build commands.

## Rules

- This repository is PUBLIC. Everything in it is visible to the world. Only sample data may appear.
- Do not edit `updates/demo/latest.json` by hand. It is signed; a hand edit would break the signature and the app would refuse the update.
- Do not edit the `gh-pages` branch by hand. It is build output.
- Release tags follow `demo-<version>`; the APK release is `demo-apk-1.3.0`. The README link points to the latest release.
- Write only what is true. Where unknown, write "Not recorded in this repository" or "Confirm with the owner".
- Plain, simple English. Dates as dd-mm-yyyy. No emojis.

## Never

- Never commit secrets, signing keys, passwords, tokens, `.env` files or personal data (real student, staff or payment data, phone numbers, emails, server addresses).
- Never change a database migration that has already been applied.
- Never sign users out and never delete logins.
- Never force-push, and never delete releases that phones may still fetch.

## When you finish

Update `CHANGELOG.md`.
