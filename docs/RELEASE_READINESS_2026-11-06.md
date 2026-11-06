# Release Readiness — 6 November 2026

## Outcome

The repository is prepared for production service configuration, but it is not safe to publish publicly yet. Play Console has accepted the final package. Automated checks prevent a production build until the production service identifiers, backend, and legal URLs are supplied.

## Finished in the repository

- Expo SDK 58 application configuration for Android and iOS.
- EAS development, preview, and production profiles.
- Google Mobile Ads native SDK and UMP consent flow.
- Rewarded advertisement action granting exactly $1,000 virtual game cash only after the earned-reward event.
- Interstitial eligibility after 180 seconds, displayed only after a completed-month summary is closed.
- Official Google test identifiers in development; production test mode is blocked.
- RevenueCat native SDK dependency and native build configuration.
- Supabase migration, authentication client, secure wallet ledger, cloud saves, leaderboard, RevenueCat webhook, AdMob SSV callback, and account deletion source.
- Privacy Policy, Terms of Service, support, and advertisement privacy entries in Settings.
- Production icon, adaptive icon foreground, splash image, and Google Play feature graphic.
- Production configuration guard: `npm run release:check`.
- Android Hermes bundle and web production export.
- Character artwork layer validation and visual capture matrix.

## Verified locally

- Jest: 16 suites, 129 tests passed.
- Strict TypeScript: passed.
- ESLint: passed.
- JSX text-container audit: passed.
- Avatar layer validation: 24 hair layers passed.
- Android production JavaScript/Hermes export: passed.
- Web production export: passed.
- Expo Doctor: 20/20 checks passed.
- Production dependency audit: five moderate transitive Expo CLI/fingerprint findings remain; npm's proposed force fix would downgrade Expo to SDK 52, so that breaking downgrade was not applied.
- Character creator visual review: representative male/female, three skin tones, small/large frames, and form-bottom captures reviewed without clipping or gear overlap.
- Local Expo server was stopped after verification.

Visual evidence is stored in `artifacts/publishing-avatar-check/`.

## Release blockers requiring account-owner action

1. **Create AdMob entries** for `com.kanan.richsimulator`. Supply only the non-secret Android App ID, rewarded unit ID, and interstitial unit ID.
2. **Create the production Supabase project.** Deploy the existing migration/functions following `docs/SUPABASE_SETUP.md`. Never paste the service-role key or webhook secrets into chat or source control.
3. **Create the RevenueCat project and Google Play products.** Public SDK keys may be configured in EAS; private webhook authorization belongs in Supabase secrets.
4. **Publish legal/support pages** at public HTTPS URLs and supply those URLs through EAS environment variables.
5. **Complete Play merchant, tax, payment-profile, Data Safety, content rating, ads, and store-listing forms.** These are legal account-owner declarations and cannot be accepted by a coding agent.
6. **Run the native internal test.** Ads and Billing cannot be validated in Expo Go. Use the `playInternal` EAS profile to produce an `.aab` with official test ads, then upload it to the Play internal track.

## Values needed after the package is accepted

These are public client configuration values and are safe to provide:

```text
Final Android package: com.kanan.richsimulator
AdMob Android App ID
AdMob Android rewarded unit ID
AdMob Android interstitial unit ID
Supabase project URL
Supabase anon/publishable key
RevenueCat Android public SDK key
Privacy Policy HTTPS URL
Terms of Service HTTPS URL
Support HTTPS URL
```

Do not provide passwords, 2FA codes, Supabase service-role keys, RevenueCat secret keys, signing keys, or Google service-account JSON in chat.

## Exact next sequence

1. Build the test Android App Bundle with `npx eas-cli@latest build --platform android --profile playInternal`.
2. Upload it to Internal testing for installation and gameplay testing.
3. Configure AdMob, Supabase, RevenueCat, and EAS production environment variables.
4. Run `npm run release:check` until it passes.
5. Build the final Android App Bundle with `npx eas-cli@latest build --platform android --profile production`.
6. Test production integrations through Play tracks: ads, consent, purchases, refunds, restore, save recovery, and account deletion.
7. Complete any closed-testing requirement shown by the account, then apply for production access.

