# Supabase production setup

The backend code is already in this repository. These steps connect it to a hosted Supabase project without exposing private keys.

## What is implemented locally

- Anonymous guest authentication with email/password account linking and sign-in.
- Account deletion from the Profile screen.
- Row Level Security for every player table.
- Server-owned wallets and an append-only wallet ledger.
- Idempotent RevenueCat purchase events and AdMob reward claims.
- Versioned cloud saves with optimistic revision conflict detection.
- Public read-only leaderboard rows; writes remain server-only.
- RevenueCat HMAC verification and AdMob ECDSA server-side verification.

The mobile app never receives the Supabase service key. Only the public project URL and publishable key are bundled in the app.

## 1. Create the hosted project

1. Sign in at <https://supabase.com/dashboard>.
2. Create a project named `rich-simulator-production` in the region closest to the expected players.
3. Generate and store a strong database password in a password manager. Do not paste it into chat or commit it.
4. Wait until the project reports `Healthy`.

## 2. Configure authentication

In **Authentication → Providers**:

1. Enable **Anonymous Sign-Ins**.
2. Keep **Email** enabled.
3. Require email confirmation before public launch.
4. Configure a production SMTP provider before public launch. The default email service is only suitable for testing.
5. Add `richsim://auth` to the allowed redirect URLs if password recovery is enabled later.

Guest accounts let a player start immediately. The Profile screen asks the player to protect the guest account with email/password before real-money purchases are enabled.

## 3. Link the repository and deploy the database

Run these commands yourself in a terminal so authentication stays private:

```powershell
npx.cmd supabase@latest login
npx.cmd supabase@latest projects list
npx.cmd supabase@latest link --project-ref YOUR_PROJECT_REF
npx.cmd supabase@latest db push
npx.cmd supabase@latest db lint --linked
```

The migration at `supabase/migrations/20261105163000_initial_backend.sql` creates all tables, policies, triggers, and trusted RPC functions.

After deployment, check **Database → Tables** and confirm RLS is enabled for:

- `profiles`
- `wallets`
- `wallet_ledger`
- `purchase_events`
- `ad_reward_claims`
- `cloud_saves`
- `leaderboard_scores`

## 4. Configure safe public app variables

From **Project Settings → API**, copy only:

- Project URL
- Publishable key

Create the EAS variables for each environment:

```powershell
npx.cmd eas-cli@latest env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT_REF.supabase.co --visibility plaintext
npx.cmd eas-cli@latest env:create --environment development --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_PUBLIC_PUBLISHABLE_KEY --visibility plaintext
npx.cmd eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT_REF.supabase.co --visibility plaintext
npx.cmd eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_PUBLIC_PUBLISHABLE_KEY --visibility plaintext
npx.cmd eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT_REF.supabase.co --visibility plaintext
npx.cmd eas-cli@latest env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_PUBLIC_PUBLISHABLE_KEY --visibility plaintext
```

For local development, copy `.env.example` to `.env.local` and replace the two public placeholder values. `.env.local` is ignored by Git and EAS uploads.

Never put a secret/service-role key in an `EXPO_PUBLIC_` variable.

## 5. Configure server secrets

Do this only after AdMob and RevenueCat projects exist. Add secrets in **Edge Functions → Secrets**, or use `supabase secrets set` in your private terminal.

| Secret | Value |
| --- | --- |
| `ADMOB_REWARDED_AD_UNIT_IDS` | Comma-separated Android/iOS rewarded ad-unit IDs |
| `ADMOB_REWARD_AMOUNT` | `1000` |
| `REVENUECAT_WEBHOOK_SIGNING_SECRET` | HMAC signing secret generated in RevenueCat |
| `REVENUECAT_WEBHOOK_AUTHORIZATION` | Optional exact Authorization header configured in RevenueCat |
| `REVENUECAT_PRODUCT_GRANTS` | JSON such as `{"cash_5000":5000,"cash_25000":25000,"cash_100000":100000}` |

Supabase automatically injects its server URL and server secret into Edge Functions. Do not create or expose replacements in the mobile app.

## 6. Deploy the server functions

```powershell
npx.cmd supabase@latest functions deploy account-delete --no-verify-jwt
npx.cmd supabase@latest functions deploy revenuecat-webhook --no-verify-jwt
npx.cmd supabase@latest functions deploy admob-ssv --no-verify-jwt
```

The public webhook URLs will be:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook
https://YOUR_PROJECT_REF.supabase.co/functions/v1/admob-ssv
```

`--no-verify-jwt` is intentional: RevenueCat and AdMob do not send Supabase JWTs. Each webhook verifies the provider signature itself. `account-delete` also verifies the supplied player access token inside the function before deleting anything.

## 7. Configure provider callbacks

### RevenueCat

1. Add the RevenueCat webhook URL.
2. Enable HMAC signing and store the signing secret as `REVENUECAT_WEBHOOK_SIGNING_SECRET`.
3. Optionally configure an Authorization header and store its exact value as `REVENUECAT_WEBHOOK_AUTHORIZATION`.
4. Send sandbox and production events while testing; the ledger stores the environment.
5. Ensure the RevenueCat App User ID is the authenticated Supabase user UUID.

### AdMob

1. Set the rewarded SSV URL to the AdMob function URL.
2. Configure the ad unit reward as `1000` virtual cash.
3. Set the ad request user ID to the authenticated Supabase user UUID.
4. Add every production rewarded ad-unit ID to `ADMOB_REWARDED_AD_UNIT_IDS`.

The AdMob function preserves the original callback query order, downloads Google's signing keys, verifies ECDSA-SHA256, validates the user/ad unit/reward, then applies the transaction once.

## 8. Production verification

Do not enable real purchases or production ad rewards until all checks pass:

1. Create a guest in the development build and confirm a matching `profiles` and `wallets` row appears.
2. Protect the guest with email/password, restart the app, and sign back in.
3. Send the same sandbox RevenueCat event twice. The second response must report a duplicate and the wallet must change only once.
4. Replay the same signed AdMob callback. The wallet must change only once.
5. Confirm the mobile publishable key cannot update `wallets`, insert `wallet_ledger`, or call any `admin_*` function.
6. Create and update a cloud save with the correct revision, then confirm an old revision returns `save_conflict`.
7. Delete the account in Profile and confirm all player rows are removed by cascading deletes.
8. Review Edge Function logs. Logs must contain event names and safe error messages only, never keys, passwords, access tokens, or full webhook bodies.

## Remaining external blockers

The repository cannot create or deploy into your private Supabase organization without your authenticated session. AdMob IDs, RevenueCat product IDs, HMAC secrets, Play Console products, and store verification must also be completed in their respective owner dashboards.

Official references:

- <https://supabase.com/docs/guides/functions/auth>
- <https://supabase.com/docs/guides/functions/deploy>
- <https://supabase.com/docs/guides/functions/secrets>
- <https://developers.google.com/admob/android/ssv>
- <https://www.revenuecat.com/docs/integrations/webhooks>
