# Broke to Millionaire — Monetization and Publishing Checklist

This is the single checklist we will follow to release Broke to Millionaire. Complete it from top to bottom. Do not begin public store submission until every **Release blocker** item is checked.

## Status legend

- `[x]` Complete in the current project
- `[ ]` Missing or not yet verified
- **Owner: Developer** — work we can implement in this repository
- **Owner: Kanan** — account, legal, tax, identity, or store-console work that requires the owner's access
- **Release blocker** — the game should not be submitted until this is complete

## Current project status

- [x] Expo SDK 58 is installed and aligned (`expo ~58.0.23`; Expo Doctor 20/20).
- [x] Android package is confirmed by the existing Play Console draft as `com.kanan.richsimulator`.
- [x] iOS bundle identifier is set as `com.kanan.richsimulator` pending the later App Store record.
- [x] The app is portrait-only.
- [x] EAS has `preview` and `production` build profiles.
- [x] Local saving exists through Zustand and AsyncStorage.
- [x] Local notifications are configured.
- [x] Native Google Mobile Ads SDK, consent flow, rewarded ads, and natural-break interstitial logic are implemented with official test IDs.
- [x] RevenueCat native SDK is installed; paid products remain disabled until store products and the hosted wallet are configured.
- [x] Secure server-wallet, idempotency, cloud-save, auth, and webhook source exists locally.
- [ ] A production Supabase database and authentication system are deployed and verified.
- [ ] Store accounts, products, privacy declarations, and listings are complete.

---

## Phase 1 — Finish and freeze the game

**Goal:** establish a stable build before adding native monetization libraries.

- [x] **Developer — Release blocker:** run all tests and fix every failure.
- [x] **Developer — Release blocker:** run TypeScript checking and ESLint with no errors.
- [ ] **Developer — Release blocker:** run the app on a physical Android device.
- [ ] **Developer — Release blocker:** run the app on a physical iPhone or TestFlight device.
- [ ] **Developer — Release blocker:** verify character creator, saving, offline progress, monthly economy, purchases made with game cash, notifications, and reset-save behavior.
- [x] **Developer:** remove development menus and debug-only screens from production builds. Avatar Debug navigation and UI are guarded by `__DEV__`.
- [x] **Developer:** add an in-game build/version display to Settings.
- [x] **Developer — Release blocker:** verify Android, iOS, and web production bundles export successfully.
- [x] **Developer:** verify the local web application responds successfully, then stop the development server.
- [ ] **Kanan:** approve the final avatar appearance and game balance.

**Completion evidence:** test output, lint/typecheck output, and a short physical-device smoke-test report.

### Physical-device smoke test still required

- [ ] Fresh install reaches the start menu without an error.
- [ ] Create male and female characters and confirm the selected appearance persists.
- [ ] Advance one month and confirm salary, expenses, age, energy, health, and happiness update once.
- [ ] Start and resume a course; confirm its study progress persists.
- [ ] Close/background the app and verify capped offline progress on return.
- [ ] Change housing, food, transport, wellness, job, business, and market selections.
- [ ] Verify notification permission and the offline-cap notification.
- [ ] Restart the application and verify the same save loads.
- [ ] Verify Settings displays the correct app and native build versions.
- [ ] Verify no Avatar Debug entry is visible in a production build.

---

## Phase 2 — Create required accounts

**Goal:** create the external accounts that the app must connect to.

- [x] **Kanan — Release blocker:** create or confirm an Expo account. EAS CLI is logged in as `tritone`.
- [x] **Kanan:** choose the Expo project owner: personal `tritone`.
- [x] **Developer:** create and link the EAS project after the owner is chosen.
- [x] **Kanan — Release blocker:** create a Google Play Console developer account.
- [x] **Kanan — Release blocker:** Google Play Console identity/account verification is approved.
- [x] **Kanan — Release blocker:** create and pay for an Apple Developer account.
- [ ] **Kanan — Release blocker:** confirm Apple Developer membership status is `Active` and provide only the non-secret Team ID/Team Name.
- [ ] **Kanan — Release blocker:** complete payment, tax, banking, and identity agreements in Google Play Console.
- [ ] **Kanan — Release blocker:** complete Agreements, Tax, and Banking in App Store Connect.
- [ ] **Kanan:** create a Google AdMob account.
- [ ] **Kanan:** create a RevenueCat project.
- [ ] **Kanan:** create a Supabase project in the intended production region.

### Secret-handling rule

Never paste private keys, service-role keys, webhook secrets, Apple private keys, Google service-account JSON, or passwords into source code or chat. We will place secrets in Supabase secrets, RevenueCat, store consoles, or EAS environment variables. Only public client keys may be bundled in the app.

---

## Phase 3 — Add a development build

**Goal:** replace Expo Go for testing native ads and purchases.

- [x] **Developer — Release blocker:** install `expo-dev-client`.
- [x] **Developer:** add an EAS `development` profile with `developmentClient: true` and `distribution: internal`.
- [ ] **Developer:** build and install an Android development client.
- [ ] **Developer:** build and install an iOS development client.
- [x] **Developer:** document how to start Metro for the development client.

Real AdMob and store purchases contain native code and cannot be tested in Expo Go.

Official guide: <https://docs.expo.dev/develop/development-builds/introduction/>

---

## Phase 4 — Create the secure backend

**Goal:** make purchased and rewarded currency server-authoritative.

**Production deployment status:** project `rich-simulator-production` is deployed in Stockholm. The SQL schema, RLS policies, trusted wallet RPCs, account UI, RevenueCat webhook, AdMob SSV callback, and account-deletion function are live. Anonymous sign-in, trigger creation, wallet reads, client mutation denial, account deletion, and legacy-key rejection passed an end-to-end smoke test on 2026-11-07. Provider secrets and the remaining mobile integrations are tracked in the later phases.

### Authentication

- [x] **Developer — Release blocker:** configure Supabase Auth with a stable player ID.
- [x] **Developer:** allow an initial anonymous/guest account if appropriate.
- [x] **Developer:** provide account linking before a player spends real money.
- [x] **Developer — Release blocker:** add sign-out and account-deletion flows if player accounts are exposed.

### Database

- [x] **Developer — Release blocker:** create `profiles`.
- [x] **Developer — Release blocker:** create `wallets`.
- [x] **Developer — Release blocker:** create an append-only `wallet_ledger`.
- [x] **Developer — Release blocker:** create `purchase_events` with a unique external transaction/event ID.
- [x] **Developer — Release blocker:** create `ad_reward_claims` with a unique AdMob transaction ID.
- [x] **Developer:** create versioned `cloud_saves`.
- [ ] **Developer:** replace the mock leaderboard with `leaderboard_scores` when ready.
- [x] **Developer — Release blocker:** enable and verify Row Level Security on every player table.
- [x] **Developer — Release blocker:** prevent the mobile client from directly setting wallet balances or inserting trusted rewards.

### Server functions

- [x] **Developer — Release blocker:** add an authenticated wallet-read function.
- [x] **Developer — Release blocker:** add an idempotent purchase-processing function.
- [x] **Developer — Release blocker:** add an AdMob server-side verification callback.
- [x] **Developer:** add versioned cloud-save synchronization and conflict handling.
- [ ] **Developer:** add validated leaderboard submission.
- [x] **Developer:** add account/data deletion.
- [x] **Developer — Release blocker:** add server logs without recording secrets or unnecessary personal data.

**Security invariant:** retrying the same advertisement or purchase callback must never grant money twice.

Official Expo/Supabase guide: <https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native>

---

## Phase 5 — Configure AdMob

**Goal:** add compliant interstitial and rewarded advertisements.

### AdMob console

- [ ] **Kanan:** create the Android app in AdMob using the final package accepted by Play Console.
- [ ] **Kanan:** create the iOS app in AdMob using the final bundle identifier.
- [ ] **Kanan:** create one Android interstitial ad unit.
- [ ] **Kanan:** create one Android rewarded ad unit.
- [ ] **Kanan:** create one iOS interstitial ad unit.
- [ ] **Kanan:** create one iOS rewarded ad unit.
- [ ] **Kanan:** configure rewarded-ad server-side verification to call the backend.
- [ ] **Kanan:** configure AdMob privacy messages/consent regions.
- [ ] **Kanan:** provide the App IDs and ad-unit IDs; these IDs are not account passwords.

### Application implementation

- [x] **Developer — Release blocker:** install `react-native-google-mobile-ads` and its Expo config plugin.
- [x] **Developer:** create one reusable ad service interface.
- [x] **Developer:** keep a fake/test implementation for Jest, web, and Expo Go development.
- [x] **Developer — Release blocker:** use Google's official test application/ad-unit IDs during development.
- [x] **Developer — Release blocker:** initialize consent before requesting production advertisements.
- [x] **Developer:** add a visible privacy-options entry when required.
- [x] **Developer:** preload advertisements and gracefully continue when no ad is available.

### Three-minute interstitial rule

- [x] **Developer:** make the player eligible for an interstitial after a 180-second cooldown.
- [x] **Developer — Release blocker:** show it only after the player closes a completed-month summary.
- [x] **Developer — Release blocker:** never interrupt a tap, purchase flow, onboarding step, or important popup.
- [x] **Developer — Release blocker:** never show an interstitial immediately at app launch.
- [x] **Developer:** reset the cooldown only after an advertisement is actually shown.
- [ ] **Developer:** disable interstitials for owners of `remove_ads`.

### Rewarded advertisement

- [x] **Developer:** add a voluntary button labelled clearly as an advertisement reward.
- [x] **Kanan:** reward confirmed as **$1,000 virtual game cash**.
- [x] **Developer — Release blocker:** clearly distinguish virtual game cash from real money.
- [ ] **Developer — Release blocker:** grant the reward only after a completed reward event and verified server callback.
- [ ] **Developer — Release blocker:** make every reward claim idempotent.
- [ ] **Developer:** add loading, unavailable, cancelled, verified, and failed states.

Official integration guide: <https://docs.page/invertase/react-native-google-mobile-ads>

---

## Phase 6 — Configure in-app purchases

**Goal:** sell virtual game cash using Apple In-App Purchase and Google Play Billing.

### Product proposal

- [ ] **Kanan:** approve product amounts and regional price tiers.
- [ ] `cash_5000` — consumable — grants $5,000 game cash.
- [ ] `cash_25000` — consumable — grants $25,000 game cash.
- [ ] `cash_100000` — consumable — grants $100,000 game cash.
- [ ] `starter_pack` — consumable or one-time entitlement, final contents to be approved.
- [ ] `remove_ads` — non-consumable — removes automatic interstitials but keeps voluntary rewarded ads.

### Store configuration

- [ ] **Kanan — Release blocker:** create matching products in Google Play Console.
- [ ] **Kanan — Release blocker:** create matching products in App Store Connect.
- [ ] **Kanan:** add localized product names, descriptions, prices, and review screenshots.
- [ ] **Kanan — Release blocker:** accept all paid-app agreements and finish tax/banking setup.
- [ ] **Kanan:** connect both store applications and products to RevenueCat.
- [ ] **Kanan:** provide RevenueCat public SDK keys through EAS environment variables.

### Application and server implementation

- [x] **Developer — Release blocker:** install the RevenueCat React Native SDK and native build dependency.
- [ ] **Developer:** build the in-game store screen with real localized store prices.
- [ ] **Developer — Release blocker:** handle pending, cancelled, failed, completed, and refunded purchases.
- [ ] **Developer — Release blocker:** associate purchases with the authenticated player ID.
- [ ] **Developer — Release blocker:** configure a signed RevenueCat webhook.
- [ ] **Developer — Release blocker:** verify the webhook signature and deduplicate its event ID.
- [ ] **Developer — Release blocker:** add purchased currency through the server wallet ledger, not directly from the client callback.
- [ ] **Developer:** add Restore Purchases for restorable products such as `remove_ads`.
- [ ] **Developer:** define refund/revocation behavior and test it.

Do not use Stripe, PayPal, or a web checkout inside the native game for virtual currency. Store billing is required for ordinary in-app digital goods.

Official guides:

- <https://www.revenuecat.com/docs/getting-started/installation/expo>
- <https://developer.apple.com/app-store/review/guidelines/>
- <https://support.google.com/googleplay/android-developer/answer/9858738>

---

## Phase 7 — Privacy, legal, and store compliance

**Goal:** make the monetized game reviewable and legally supportable.

- [ ] **Kanan — Release blocker:** publish a Privacy Policy at a public HTTPS URL.
- [ ] **Kanan — Release blocker:** publish Terms of Service at a public HTTPS URL.
- [ ] **Kanan — Release blocker:** provide a public support URL and support email.
- [x] **Developer:** link Privacy Policy, Terms, support, privacy choices, and account deletion from Settings. Public HTTPS URLs still need to be supplied.
- [ ] **Developer — Release blocker:** inventory all collected data and third-party SDK data use.
- [ ] **Kanan — Release blocker:** complete Google Play Data Safety accurately.
- [ ] **Kanan — Release blocker:** complete Apple App Privacy answers accurately.
- [ ] **Kanan — Release blocker:** complete store content/age-rating questionnaires.
- [ ] **Kanan — Release blocker:** declare that the app contains advertisements and in-app purchases.
- [ ] **Developer:** configure iOS tracking permission only if the chosen advertising setup requires tracking.
- [ ] **Developer — Release blocker:** ensure bought virtual currency never expires.
- [ ] **Developer — Release blocker:** ensure advertisements cannot be confused with game buttons.
- [ ] **Developer — Release blocker:** ensure the game never suggests that virtual cash is redeemable for real money.

---

## Phase 8 — Store assets and listings

**Goal:** prepare everything users and reviewers see in the stores.

- [x] **Kanan:** final working store name: `Broke to Millionaire`.
- [x] **Developer/Kanan — Release blocker:** provide a compliant final app icon.
- [x] **Developer/Kanan — Release blocker:** provide final splash assets and Android adaptive icon foreground.
- [ ] **Kanan — Release blocker:** write short and full store descriptions.
- [ ] **Kanan:** prepare promotional text and keywords for iOS.
- [ ] **Developer/Kanan — Release blocker:** capture required Android phone screenshots.
- [ ] **Developer/Kanan — Release blocker:** capture required iPhone screenshots.
- [x] **Developer/Kanan:** create a Google Play feature graphic. Preview video remains optional.
- [ ] **Kanan — Release blocker:** supply category, contact details, copyright, and review notes.
- [ ] **Kanan:** disclose and explain the rewarded advertisements and purchases in review notes.

---

## Phase 9 — Testing before submission

**Goal:** prove ads, payments, saving, and restore flows work without real customer risk.

- [x] **Developer — Release blocker:** development builds default to official AdMob test IDs; production configuration rejects test mode.
- [ ] **Developer — Release blocker:** test Android purchases through a Google Play internal-testing track.
- [ ] **Developer — Release blocker:** test iOS purchases with sandbox/TestFlight accounts.
- [ ] **Developer — Release blocker:** verify a repeated purchase webhook cannot duplicate money.
- [ ] **Developer — Release blocker:** verify a repeated AdMob callback cannot duplicate $1,000.
- [ ] **Developer — Release blocker:** test cancelled, unavailable, offline, pending, refunded, and restored purchases.
- [ ] **Developer:** test reinstall and account recovery.
- [ ] **Developer:** test guest-to-account linking without losing purchases or progress.
- [ ] **Developer:** test consent flows for relevant regions.
- [ ] **Developer:** test `remove_ads` while keeping voluntary rewarded advertisements available.
- [ ] **Developer — Release blocker:** complete a clean-install smoke test on small and large Android/iOS devices.
- [x] **Developer — Release blocker:** run unit tests, lint, typecheck, layer validation, JSX text audit, and production export checks.

---

## Phase 10 — Build, submit, and release gradually

**Goal:** submit signed production binaries and monitor a controlled launch.

- [ ] **Developer — Release blocker:** bump the application version and native build numbers.
- [ ] **Developer — Release blocker:** create the Android production `.aab`.
- [ ] **Developer — Release blocker:** create the iOS production `.ipa`.
- [ ] **Developer/Kanan:** upload Android to the internal testing track first.
- [ ] **Developer/Kanan:** upload iOS to TestFlight first.
- [ ] **Kanan — Release blocker:** finish every Play Console setup warning and store-listing field.
- [ ] **Kanan — Release blocker:** finish every App Store Connect setup warning and store-listing field.
- [ ] **Developer/Kanan:** provide a working review account or review instructions when required.
- [ ] **Kanan:** submit in-app products with the application where required.
- [ ] **Kanan:** submit the builds for store review.
- [ ] **Developer/Kanan:** use a gradual/staged rollout rather than immediately releasing to everyone.
- [ ] **Developer/Kanan:** monitor crashes, failed purchases, duplicate callbacks, advertisement errors, retention, and reviews.

Expected production commands:

```powershell
npx eas-cli@latest build --platform android --profile production
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform android --latest
npx eas-cli@latest submit --platform ios --latest
```

Official submission guide: <https://docs.expo.dev/deploy/submit-to-app-stores/>

---

## Work log

Add a dated entry whenever we complete a phase or make an important monetization decision.

| Date | Phase | Result | Evidence/notes |
| --- | --- | --- | --- |
| 2026-11-05 | Initial audit | Checklist created | Expo SDK 58, application identifiers, and current EAS profiles verified from the repository. |
| 2026-11-05 | Phase 1 automated checks | Passed | 14 suites/118 tests, ESLint, strict TypeScript, JSX text audit, Expo Doctor 20/20, production export for Android/iOS/web, and local HTTP 200 boot check. Physical-device checks remain. |
| 2026-11-05 | Phase 2 Expo account | Confirmed | EAS is logged in as `tritone`. The app is not linked to an EAS project; owner selection is pending. |
| 2026-11-05 | Phase 3 local setup | Passed | Installed the SDK 58 development client, added the EAS development profile, and documented native-client commands. Cloud builds await the Expo owner selection. |
| 2026-11-05 | EAS project link | Passed | Created `@tritone/rich-simulator`, linked project ID `079a11cf-1388-45e6-9925-19a4fad87909`, created remote Android credentials, and submitted development build `10badd63-b6a8-49c1-9f07-5e73368db13a`. |
| 2026-11-05 | Android build correction | Resubmitted | Build `9bf19d3f-4379-42d2-8c3a-42e4c488e1bb` showed that npm 11's lock output was still incompatible with EAS npm 10 (`@emnapi/core`/`runtime` missing). Regenerated with npm 10, passed the exact EAS `npm ci --include=dev --dry-run`, and submitted build `26500199-b59b-4cbf-a2d6-15ddd7a729c7`. |
| 2026-11-05 | Google Play account | Waiting externally | Developer account created; Google verification is processing. |
| 2026-11-05 | Apple Developer account | Partially confirmed | Paid membership reported by Kanan. Active status and non-secret Team ID/Team Name still need confirmation; passwords and 2FA codes must remain private. |
| 2026-11-05 | Google Play release preparation | Configured locally | Added production version auto-increment, draft internal-track submission defaults, and `docs/GOOGLE_PLAY_RELEASE.md`. Public submission remains blocked by verification, monetization/backend work, policy forms, final testing, and the required closed test when applicable. |
| 2026-11-05 | Phase 4 backend implementation | Passed locally | Added Supabase schema/RLS, guest and linked-account client flows, server wallet ledger, cloud-save conflicts, leaderboard reads, RevenueCat HMAC webhook, AdMob ECDSA SSV callback, account deletion, deployment guide, and automated artifact checks. Hosted deployment awaits Kanan's Supabase project. |
| 2026-11-05 | Final local verification | Passed | 15 suites/128 tests, ESLint, strict TypeScript, JSX text audit, Expo Doctor 20/20, and Android/iOS/web production exports passed after backend integration. |
| 2026-11-06 | Play Console account | Verified | Kanan confirmed Google approved the developer account. Package registration remains blocked because the proposed identifiers are reported as already registered. |
| 2026-11-06 | Native monetization foundation | Passed locally | Added Google Mobile Ads/UMP and RevenueCat native SDKs, a rewarded $1,000 virtual-cash action, a three-minute natural-break interstitial, production environment guards, and test coverage. |
| 2026-11-06 | Store artwork | Added | Generated and configured 1024×1024 application/adaptive/splash artwork and a 1024×500 Google Play feature graphic. |
| 2026-11-06 | Release verification | Passed with expected external blockers | 16 suites/129 tests, ESLint, strict TypeScript, JSX text audit, layer checks, web export, and Android Hermes export passed. `release:check` correctly blocks a production build until the final package, public service IDs/keys, and legal URLs are configured. |
| 2026-11-07 | Play internal App Bundle | Passed | EAS build `b4ba6045-f864-4437-af4d-54053885b687` finished successfully for `com.kanan.richsimulator`, Expo SDK 58, app `1.0.0`, version code `5`. The signed `.aab` was downloaded to `artifacts/Broke-to-Millionaire-v1.0.0-code5.aab` and verified with SHA-256 `EFDF2394C3C086D33124530831EBF204EAF317795BAC967FF84AD0BBD1A0ABBF`. |
| 2026-11-07 | Supabase production backend | Passed | Created isolated project `rich-simulator-production` in Stockholm, deployed the migration and three Edge Functions, configured EAS public client values, enabled anonymous auth, disabled legacy API keys, and passed live auth/trigger/wallet/RLS/deletion smoke tests. |
| 2026-11-07 | Rewarded-ad identity wiring | Passed locally | Native rewarded requests now obtain the current Supabase player UUID and attach it through AdMob server-side verification options. Added regression tests; 18 suites/133 tests, ESLint, strict TypeScript, JSX text audit, and iOS/Android/web production bundles passed. The release gate now reports only AdMob, RevenueCat, and public legal/support configuration. |

## Next action

Upload `artifacts/Broke-to-Millionaire-v1.0.0-code5.aab` to the existing `Broke to Millionaire` Play Console app's Internal testing track. The registered package and bundle package are both `com.kanan.richsimulator`. Then add testers, save the draft release, and start the internal rollout. Keep passwords, 2FA codes, private keys, service-role keys, and service-account JSON private.
