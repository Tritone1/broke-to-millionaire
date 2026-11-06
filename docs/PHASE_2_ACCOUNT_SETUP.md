# Phase 2 Account Setup

Audit date: 2026-11-05

## Current status

- Expo login: confirmed as `tritone`.
- Selected Expo owner: `tritone`.
- EAS project link: complete (`@tritone/rich-simulator`).
- EAS project ID: `079a11cf-1388-45e6-9925-19a4fad87909`.
- Google Play Console: account created and developer verification approved.
- Apple Developer/App Store Connect: paid membership confirmed by Kanan; Active status and Team ID/Team Name still need confirmation.
- AdMob: owner confirmation required.
- RevenueCat: owner confirmation required.
- Supabase: owner confirmation required.

## Step 1 — Expo owner and project

Completed:

- Owner: `tritone`.
- Project: `@tritone/rich-simulator`.
- Android development credentials: created and stored remotely by EAS.
- Android development build: submitted to EAS.

The project ID is stored under `expo.extra.eas.projectId` in `app.json`.

## Step 2 — Google accounts

Kanan must create or confirm:

1. Google Play Console developer account. **Created and verified.**
2. Payments profile, identity verification, tax information, and bank account.
3. Google Play app reservation for a final lowercase package that Play Console accepts. The previously attempted identifiers are reported as already registered.
4. Google AdMob account.

Check **All apps** and Android developer-verification package registrations before creating another app. After the first accepted artifact is uploaded, its package name is permanent; use the same final value across Expo, AdMob, RevenueCat, and Supabase.

## Step 3 — Apple accounts

Kanan must create or confirm:

1. Paid Apple Developer Program membership. **Paid; Active status still needs confirmation.**
2. App Store Connect access.
3. Agreements, tax information, and banking setup.
4. App record/bundle ID matching the final application identifier.

The iOS bundle identifier becomes permanent after publication, so confirm it before creating the App Store record.

## Step 4 — Service accounts

Create one production project in each service:

1. Supabase — authentication, database, wallet ledger, cloud saves, and server functions.
2. RevenueCat — Apple/Google purchase validation and webhook events.
3. AdMob — Android/iOS interstitial and rewarded advertisement units.

Use the same application name and identifiers consistently across every service.

## What to send to the developer

Safe to provide:

- Expo owner name.
- Supabase project URL and public/publishable key.
- RevenueCat public Android/iOS SDK keys.
- AdMob Android/iOS App IDs and ad-unit IDs.
- Store product IDs.

Never send or commit:

- Supabase secret/service-role key.
- RevenueCat secret API key or webhook signing secret.
- Apple private keys or passwords.
- Google service-account JSON.
- Bank, tax, or identity documents.

Private server credentials will be entered directly into Supabase, RevenueCat, EAS environment variables, or the relevant store console.
