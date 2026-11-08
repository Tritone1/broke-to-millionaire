# Broke to Millionaire

Broke to Millionaire is a complete local-first life-and-money simulation built with React Native, Expo SDK 58, and strict TypeScript. Create a visual identity, start homeless with no job or bills, then build a career, family, asset portfolio, and legacy across three independent save slots.

## Features

- Separate Work and Study screens: eight courses with housing/food/transport standards, affordable-tuition checks, exams and retakes; sixteen jobs with interviews, experience, promotions, and monthly salaries, including four-level technology and five-level finance ladders
- Nine company types with custom names, employees, wages, productivity, upgrades, reputation, managers, active boosts, sales, and IPO listings
- Fifteen fictional stocks and eight fictional coins with seeded random-walk prices, trends, sector news, watchlists, market/limit orders, fees, dividends, chart history, and portfolio P/L
- Six-deck blackjack with hit, stand, double, split, dealer 17, and 3:2 natural payouts
- European single-zero roulette with straight, split, color, parity, high/low, dozen, and column bets
- Six-horse seeded races with form-based odds, win/place/show/exacta tickets, animations, and result history
- Daily casino loss guard, explicit virtual-currency notice, and lifetime casino statistics
- Offline salary, expenses, study, aging, business, partner, passive-bonus, dividend, and market progress all stop together after one game month (60 seconds), with a simulated rewarded-ad net 2× claim
- Lifestyle trophies plus a personal-items shop beside Housing, Food, and Transport for phones, laptops, timepieces, and paintings; ranks, daily rewards, missions, achievements, mock leaderboard, 80 data-driven illustrated life events, and prestige
- Three save slots with migration through save version 12 and a focused character creator for male/female body type, ethnicity, six skin tones, and six hairstyles; the saved layered character is reused in the HUD and game scenes
- A configurable 60-second month with pause/x2/x4 controls, one monthly payday, itemized income and bill summaries, birthdays, late fees, housing downgrade, repossession, and a 12-month budget view
- A zero-cost homeless/walking/community-meal start; selectable housing, food, healthcare, and transport plans; amortized mortgages, leasing, financing, recurring costs, and depreciation
- Generated dating profiles with age, pronouns, career, personality, and income; engagement, marriage, divorce asset splits, children, private school, nannies, and college funds
- Food and healthcare plans, happiness, health, energy, stress-driven health event popups, income-limited bank loans, and debt-aware net worth
- Nine original illustrated raster locations with day/night lighting, three depth layers, ambient movement, reusable character reactions, a scene-first home screen, and full-screen dialogue scenes
- A two-row safe-area HUD, fixed five-icon navigation, contextual scene actions, Lilita One/Inter typography, glossy controls, and responsive iPhone SE/large-phone layouts
- A generic requirement engine for cash, fees, monthly affordability, skills, education, experience, age, wellbeing, ownership, relationships, reputation, and net worth
- Mantissa/exponent big numbers, Zustand state, AsyncStorage migrations, ten-second autosave, background save, local reminders, Reanimated effects, haptics, and sound fallback
- Automated JSX audit that rejects raw string/number children in native containers

## Requirements

- Node.js 22.13+ on Node 22, 24.3+ on Node 24, or Node 26+
- npm
- Expo Go compatible with SDK 58

## Run locally

```bash
npm install
npx expo start
```

To run on a phone:

1. Install Expo Go on the phone.
2. Connect the phone and computer to the same network.
3. Run `npx expo start` from this directory.
4. Scan the terminal QR code with Expo Go on Android or the Camera app on iOS.
5. If LAN routing is unavailable, run `npx expo start --tunnel`.

The app is portrait-only. Notifications may behave differently in Expo Go than in a development/release build. No audio file is required; sound calls fall back silently instead of loading a missing asset.

## Verification

```bash
npm run typecheck
npm run lint
npm run audit:jsx
npm run assets:check-avatar
npm run assets:build-avatar
npm test
npx expo install --check
npx expo export --platform android
```

`npm run audit:jsx` uses the TypeScript JSX AST to catch raw text, primitive expressions, and unsafe `value && <Component />` operands under React Native containers.

## Build an APK with EAS

```bash
npm install --global eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

The `preview` profile in `eas.json` creates an installable APK. Build a Play Store AAB with:

```bash
eas build --platform android --profile production
```

## Advertisements and native builds

The native application uses `react-native-google-mobile-ads`; Expo Go/web/Jest use the compatible simulated provider. Development builds default to Google's official test identifiers. Configure the public `EXPO_PUBLIC_ADMOB_*` values from `.env.example` through EAS for production. Rewarded cash is granted only after the earned-reward event, and interstitials are eligible after 180 seconds but display only at the natural break after a monthly summary closes.

Native advertisements and RevenueCat purchases are not available in standard Expo Go. Build the development client with `eas build --platform android --profile development` before testing either SDK.

## Production backend and purchases

The production Supabase project is connected and deployed. It provides the secure wallet ledger, cloud-save conflict handling, guest-to-email account linking, account deletion, an authenticated RevenueCat webhook, refund/revocation adjustments, and the AdMob server-side verification callback. The Store screen loads localized Google Play prices through RevenueCat; cash is credited only after the server records and exposes a verified grant. `remove_ads` suppresses automatic interstitials while keeping voluntary rewarded ads available.

The RevenueCat webhook currently requires both its private URL token and matching Authorization header. HMAC verification is also implemented and activates when `REVENUECAT_WEBHOOK_SIGNING_SECRET` is configured after enabling HMAC signing in RevenueCat. No server secret is bundled in the application.

Follow [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) to create the hosted project, deploy the schema/functions, configure provider secrets, and run the duplicate-callback security checks. Never bundle a Supabase service key or webhook secret in the app.

## Architecture

```text
src/
  components/   safe wrappers, charts, requirement gates, scene art, characters, modals, animations
  data/         courses, jobs, 64 life events, company types, market assets, lifestyle, living costs
  game/         big numbers, requirements, education, life formulas, market engine, casino games, tick
  hooks/        timestamp runtime and app lifecycle
  navigation/   scene action dock plus life, budget, and profile details
  screens/      title, character setup, Home, Career, Business, Market, Casino, Life, Budget, Profile
  services/     ads, backend client, three-slot storage/migration, notifications, audio fallback
  store/        versioned Zustand life and session state
scripts/
  audit-jsx.cjs strict React Native text-child audit
supabase/
  migrations/   RLS-protected player, wallet, purchase, reward, save, and leaderboard schema
  functions/    account deletion, RevenueCat webhook, and AdMob SSV callback
```

See [BALANCING.md](./BALANCING.md) for economy, career, market, and casino tuning.

## Art replacement pipeline

Runtime art is indexed by `src/data/artManifest.ts`; the asset-side contract is `assets/game/manifest.json`. Portrait and full-body avatars are baked onto shared 512-wide canvases, so hair, head/ears, neck, clothing, and foreground hair all use one origin and are never independently positioned at runtime. The anatomical anchors, crop, proportions, layer order, and per-style fit declarations live in `src/data/avatarAnchors.ts` and `src/data/avatarAnchorData.json`.

The source artwork uses six painted head atlases (one per skin tone), six ethnicity columns, male/female rows, and one transparent six-style hair atlas. Run `npm run assets:normalize-avatar` after replacing source art, then `npm run assets:build-avatar` to generate the aligned portrait/full-body atlases. Hair is baked as a rear skull/nape layer and a foreground hairline/temple layer; ears remain in the head layer between them. `npm run assets:check-avatar` validates source-cell padding, while Jest validates every hairstyle against the head, temple, shoulder, and canvas bounds. In development, open More -> Avatar Debug to display the shared grid and anchors, tint individual layers, manually step, or auto-cycle all 288 hairstyle/skin/outfit/gender combinations.

Per-style fit notes: Buzz cut uses `y -3 / scale 0.98` so its crown contains the head-top anchor while its short sides stay above the ears. Curly crop uses `y -2` to seat its dense crown. Side sweep uses `x -4 / y -2 / scale 1.02` to balance its asymmetric mass at the temples. Long waves use `y -4 / scale 0.98` to preserve top margin and shoulder clearance. Braids use `y -3 / scale 0.96` to keep the ends inside the shoulder line. High ponytail uses `x -2 / scale 0.82` because its high bun is substantially taller than the other sources; the reduced fit keeps the complete crown inside the canvas without moving the shared head anchors.

The round blue gear shown by Expo Go is Expo's development tools button, not part of the game UI, so application layout code cannot reposition it. It is absent from production builds. To hide it for an Expo Go test launch, set `EXPO_NO_DEV_MENU=1` before starting Expo (`$env:EXPO_NO_DEV_MENU=1` in PowerShell, then `npx expo start`).

## Visual QA screenshots

Real web-rendered captures from the Expo app are in `artifacts/screenshots/`:

- Home: `home-se.png`, `home-large.png`
- Career: `career-se.png`, `career-large.png`
- Market: `market-se.png`, `market-large.png`
- Event: `event-se.png`, `event-large.png`

The `?preview=game&screen=Home|Career|Market|Event&device=small|large` web-only query is a deterministic visual-QA harness. It does not affect native gameplay or saved games.

The latest shared-canvas avatar captures are in `artifacts/screenshots/avatar-unified/`. They include character-creator and HUD/gameplay screenshots for all six hairstyles at three skin tones, plus female braids and waves checks. The older broad ethnicity/body matrix remains in `artifacts/screenshots/portrait-audit/`.

The scene-framing regression set is in `artifacts/screenshots/avatar-framing/`. It contains Home, Park, Bank, Office, University, Business, and Career at both 320x568 and 430x932. These captures verify full-body ground contact, anchor-derived bust crops, the shared HUD portrait fallback, and the non-overlapping gems/settings/speed header layout.
