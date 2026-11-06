# Rich Simulator Development Build

The development build replaces Expo Go for native modules such as AdMob and in-app purchases.

## EAS project

The project is linked to `@tritone/rich-simulator` with EAS project ID `079a11cf-1388-45e6-9925-19a4fad87909`.

If the local link ever needs to be recreated, run:

```powershell
npx eas-cli@latest init --account tritone
```

Do not initialize it under a different owner. The project ID binds builds and updates to this Expo project.

## Build Android development client

```powershell
npx eas-cli@latest build --platform android --profile development
```

Open the resulting installation link on the Android phone and install the development APK.

Current corrected build: `26500199-b59b-4cbf-a2d6-15ddd7a729c7`. It was submitted after regenerating `package-lock.json` with npm 10 to match the EAS worker.

## Build iOS development client

```powershell
npx eas-cli@latest build --platform ios --profile development
```

An Apple Developer account and registered device are normally required for an internal iOS device build.

## Start Metro after installing the client

```powershell
npm run start:dev
```

Keep the computer and phone on the same network, open the Rich Simulator development client, and select the Metro development server. If LAN discovery is unavailable, use:

```powershell
npx expo start --dev-client --tunnel
```

## When a new native build is required

Rebuild the development client after:

- adding or updating a package that contains native code;
- changing an Expo config plugin;
- changing native permissions or application identifiers;
- upgrading Expo SDK.

Ordinary TypeScript, UI, game logic, and asset changes only require restarting or reloading Metro.

## Verification

After installation:

1. Confirm the app opens without Expo Go.
2. Confirm Settings displays the application and native build versions.
3. Confirm the Avatar Debug entry exists in the development build.
4. Complete the physical-device smoke-test section in `docs/PUBLISHING_CHECKLIST.md`.
5. Later, verify test advertisements and sandbox purchases in this client.
