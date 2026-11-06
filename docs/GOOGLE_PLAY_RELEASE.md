# Publish Broke to Millionaire on Google Play

Complete the steps in order. Do not publish a public production release until advertisements, in-app purchases, server verification, privacy disclosures, and final device testing are complete.

## Current status

- Google Play Console account: created.
- Google developer verification: approved.
- Android package: `com.kanan.richsimulator`, confirmed by the existing Play Console draft.
- Expo project: `@tritone/rich-simulator`.
- EAS production output: Android App Bundle (`.aab`).
- Production version code: managed and incremented remotely by EAS.
- Default automated submission target: Internal testing, draft release.
- Native advertisement SDK and app logic: implemented with official test IDs; production AdMob identifiers are pending.
- RevenueCat native SDK: installed; store products and secure purchase grants are pending.
- Secure wallet/backend source: implemented locally; production Supabase deployment is pending.
- Privacy policy and Data Safety declaration: missing.

## 1. Finish Play Console account setup

Account verification is approved. Confirm in Play Console that no contact, organization, payment-profile, device-verification, or merchant tasks remain.

## 2. Create the Play Console app

In Play Console, choose **Create app** and enter:

- App name: `Broke to Millionaire`.
- Default language: the language used by the store listing.
- App or game: **Game**.
- Free or paid: **Free** if the game will be supported by ads and in-app purchases.
- Developer declarations: accept only after reading them.

The app already exists as a Play Console draft with package `com.kanan.richsimulator`. Use this existing app; do not create another record. Use the same identifier in Expo, AdMob, and RevenueCat. Package names are globally unique and permanent after the first artifact is uploaded.

## 3. Complete the store listing

Prepare and upload:

- App name.
- Short description.
- Full description.
- Final high-resolution app icon.
- Feature graphic.
- Phone screenshots from a release build.
- Game category and tags.
- Support email.
- Public support website.
- Public privacy-policy URL.

Do not use screenshots containing debug menus, test ads, placeholder prices, private email addresses, or development overlays.

## 4. Complete App content declarations

Open **Policy and programs > App content** and complete every item shown by Play Console, including:

- Privacy policy.
- Ads declaration: **Yes** after AdMob is integrated.
- App access instructions. If login is required, provide a working reviewer account or review mode.
- Target audience and content.
- Content rating questionnaire.
- Data Safety form.
- Any financial-features declaration shown by Play Console.
- Any advertising ID or sensitive-permission declaration shown by Play Console.

Rich Simulator contains a simulated casino. It must never offer real-money gambling, cash-out, transferable value, or real prizes. Answer content-rating and gambling-related questions accurately based on the final build.

The store listing and in-game purchase UI must clearly distinguish virtual game cash from real money.

## 5. Finish monetization before the final test build

Complete these repository phases first:

1. AdMob interstitial and rewarded ads using test IDs during development.
2. Consent/privacy flow.
3. Google Play Billing products through RevenueCat.
4. Server-verified and idempotent purchase grants.
5. Server-side verification for rewarded-ad grants.
6. `remove_ads` entitlement.
7. Refund and restored-purchase handling.
8. Privacy Policy, Terms, and account/data-deletion flow.

Do not put Stripe, PayPal, or another external checkout inside the Android game for virtual currency.

## 6. Build the production Android App Bundle

Run only after the final monetization configuration and environment variables are ready:

```powershell
cd C:\Users\kanan\Desktop\richSim
npx eas-cli@latest build --platform android --profile production
```

The `production` EAS profile creates a signed `.aab` and automatically increments the remote Android version code.

## 7. Upload the first release to Internal testing

The safest first upload is a draft Internal testing release.

### Manual method

1. Download the `.aab` from the Expo build page.
2. Open Play Console.
3. Go to **Test and release > Testing > Internal testing**.
4. Create a release.
5. Enable Play App Signing; use Google's generated app-signing key unless there is a specific reason not to.
6. Upload the `.aab`.
7. Add release notes.
8. Save as draft, review all warnings, then roll out only to internal testers.

### EAS Submit method

Create a Google service account with the minimum Play Console permissions needed for releases, configure it privately with Expo, then run:

```powershell
npx eas-cli@latest submit --platform android --profile production --latest
```

The repository defaults this submission to a **draft Internal testing** release. Never commit the Google service-account JSON file.

## 8. Run Internal testing

Use Internal testing for initial installation, purchase, ad, save, notification, performance, and crash checks. It supports up to 100 testers and is normally available quickly.

Verify at minimum:

- Fresh installation and onboarding.
- Save and restore after process termination.
- Offline progress.
- Advertisements and consent.
- Rewarded-ad grants exactly once.
- Test purchases, refunds, restore, and `remove_ads`.
- Account linking and deletion.
- Small and large Android screens.
- Low-memory/restart behavior.

## 9. Run the required Closed test

If this is a personal developer account created after 13 November 2023, Google currently requires:

- At least 12 testers.
- Every tester opted into the Closed test continuously for at least 14 days.
- A production-access application after the testing requirement is met.

Internal testers do not satisfy this closed-test requirement. Create a Closed testing track, add the testers, distribute its opt-in link, and make sure at least 12 remain opted in for the full continuous period.

Collect real feedback and record the defects fixed during testing because Google asks about the testing process when production access is requested.

## 10. Apply for production access

After the required Closed test:

1. Open the Play Console Dashboard.
2. Select **Apply for production access**.
3. Answer the questions about the game, testers, feedback, changes, and production readiness truthfully.
4. Wait for Google's decision.

Production and open testing may remain unavailable until this application is approved.

## 11. Create the production release

After production access and all policy tasks are approved:

1. Promote the tested build or create a newer production release.
2. Confirm the version code is higher than every previous upload.
3. Review device compatibility and automated pre-launch reports.
4. Fix every blocking policy or technical warning.
5. Start with a staged rollout rather than 100% immediately.
6. Monitor crashes, ANRs, failed purchases, ad errors, server callbacks, reviews, and refund behavior.

## Official references

- Google testing requirements: <https://support.google.com/googleplay/android-developer/answer/14151465>
- Google testing tracks: <https://support.google.com/googleplay/android-developer/answer/9845334>
- Google app-content preparation: <https://support.google.com/googleplay/android-developer/answer/9859455>
- Expo Android submission: <https://docs.expo.dev/submit/android/>
- Expo manual Play upload: <https://docs.expo.dev/submit/android-manual/>
