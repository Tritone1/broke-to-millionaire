# Phase 1 Release Audit

Audit date: 2026-11-05

## Result

The repository passes its automated release checks. Phase 1 is not fully closed because Android and iPhone physical-device smoke tests require Kanan's devices.

## Changes made

- Aligned Expo SDK 58 packages to the versions required by Expo Doctor.
- Added `expo-constants` as a direct SDK-compatible dependency.
- Replaced the hardcoded Settings version with the runtime app version and native build version.
- Kept Avatar Debug navigation and its More-screen entry behind `__DEV__`, making them unavailable in production mode.
- Added the physical-device smoke-test checklist to `docs/PUBLISHING_CHECKLIST.md`.

## Automated verification

| Check | Result |
| --- | --- |
| Jest | Passed: 14 suites, 118 tests |
| ESLint | Passed |
| Strict TypeScript | Passed |
| JSX text audit | Passed; no raw primitive children in native containers |
| Expo Doctor | Passed: 20/20 checks |
| Android production bundle | Passed |
| iOS production bundle | Passed |
| Web production bundle | Passed |
| Local web boot | Passed: HTTP 200 |
| Development server shutdown | Passed: port 19006 closed |

## Dependency audit note

`npm audit --omit=dev` reports five moderate advisories in `glob`/`minimatch` reached through Expo CLI/fingerprint tooling. npm's proposed forced resolution would downgrade Expo from SDK 58 to SDK 52, which is a breaking and unsafe change for this project. No forced downgrade was applied. Recheck after the next Expo SDK 58 patch and again immediately before store submission.

## Remaining Phase 1 work

- Run the checklist on a physical Android phone.
- Run the checklist on a physical iPhone or TestFlight device.
- Record any runtime, layout, notification, persistence, or performance defects.
- Obtain final approval for the character appearance and launch economy.
