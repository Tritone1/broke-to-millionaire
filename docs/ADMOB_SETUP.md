# AdMob production setup

The game uses `react-native-google-mobile-ads`. Expo Go cannot load this native SDK; use an Android development build or a signed AAB/APK. Development and automated tests use Google's official demo ad identifiers. Production identifiers are read from ignored environment files and are never committed.

## Required local environment

Copy `.env.example` to `.env.local` and set:

- `EXPO_PUBLIC_ADS_TEST_MODE=false`
- `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
- `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID`
- `EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_ID`

Do not put service-account JSON, keystores, Supabase service-role keys, or AdMob server secrets in an `EXPO_PUBLIC_` variable. The local AAB script loads `.env.local` and stops before Gradle when production ads are selected but an Android ID is missing.

## Rewarded placements

- Wellness: +20 energy, capped at 100, 10-minute cooldown.
- Work: +25% to the next eligible work shift, one use, 20-minute cooldown.
- More: one extra normal opportunity, maximum one queued, 30-minute cooldown.

The reward is applied only after Google emits `EARNED_REWARD`. Closing early, load failure, or a duplicate callback cannot grant it twice. Cooldowns and pending rewards are persisted in the save.

## Interstitial policy

Interstitials are considered only after major transitions such as birthdays and promotions. The session policy has a three-minute launch grace period, requires two meaningful transitions, allows at most one ad per five minutes and three per rolling 30 minutes, and separates interstitials from rewarded ads. If an ad is unavailable, gameplay continues immediately. Buying Remove Ads disables automatic interstitials but leaves opt-in rewarded ads available.

## Consent and age settings

The SDK requests Google UMP consent before initialization and exposes Privacy Options when required. Current request configuration assumes the Play Console audience declaration is a general audience that is not child-directed (`PG`, child-directed false, under-age-of-consent false). If the Play audience declaration changes, update these flags before release.

## Release checklist

1. Use AdMob test devices or Google's demo IDs during development. Never click live ads yourself.
2. Confirm the AdMob app and both Android ad units are approved and match the package `com.kanan.richsimulator`.
3. Confirm the Play Console Data safety and Ads declarations match the SDK and consent behavior.
4. Run `npm run typecheck`, `npm run lint`, and `npm test`.
5. Build with `npm run android:aab:local` and test the resulting signed bundle through Play internal testing.
6. Test consent flows in an EEA test geography, early-close rewarded ads, no-fill/offline behavior, cooldown persistence after restart, Remove Ads, and background/foreground transitions.

Ad analytics are routed through `src/services/ads/adAnalytics.ts`. It intentionally defaults to a no-op sink; connect an approved analytics provider there without changing ad or reward logic.
