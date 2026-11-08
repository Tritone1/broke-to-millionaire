declare const require: (id: string) => { readFileSync: (path: string, encoding: string) => string };
declare const process: { cwd: () => string };

const { readFileSync } = require('node:fs');

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, 'utf8');
const migration = read('supabase/migrations/20261105163000_initial_backend.sql');

describe('production backend artifacts', () => {
  test.each([
    'profiles',
    'wallets',
    'wallet_ledger',
    'purchase_events',
    'ad_reward_claims',
    'cloud_saves',
    'leaderboard_scores',
  ])('%s has row level security enabled', (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security;`);
  });

  it('keeps trusted money mutation functions away from mobile roles', () => {
    expect(migration).toContain('grant execute on function public.admin_process_purchase_event');
    expect(migration).toContain('grant execute on function public.admin_process_ad_reward');
    expect(migration).toMatch(/admin_process_purchase_event[\s\S]+to service_role;/);
    expect(migration).toMatch(/admin_process_ad_reward[\s\S]+to service_role;/);
    expect(migration).toContain('revoke all on public.wallets from anon, authenticated;');
    expect(migration).toContain('revoke all on public.wallet_ledger from anon, authenticated;');
  });

  it('rejects duplicate event IDs owned by another player', () => {
    expect(migration).toContain('purchase_owner_mismatch');
    expect(migration).toContain('ad_reward_owner_mismatch');
    expect(migration).toContain('transaction_owner_mismatch');
  });

  it('verifies external provider callbacks before granting money', () => {
    const revenueCat = read('supabase/functions/revenuecat-webhook/index.ts');
    const admob = read('supabase/functions/admob-ssv/index.ts');
    expect(revenueCat).toContain('x-revenuecat-webhook-signature');
    expect(revenueCat).toContain('hmacSha256Hex');
    expect(revenueCat).toContain('REVENUECAT_WEBHOOK_TOKEN');
    expect(revenueCat).toContain('admin_process_purchase_event');
    expect(admob).toContain('verifyAdMobSignature');
    expect(admob).toContain('ADMOB_REWARDED_AD_UNIT_IDS');
    expect(admob).toContain('SSV_VERIFICATION_USER_ID');
    expect(admob).toContain('SSV_VERIFICATION_CUSTOM_DATA');
    expect(admob).toContain('CASH_REWARD_CUSTOM_DATA');
    expect(admob).toContain("reward: 'non_cash'");
    expect(admob).toContain('decodeURIComponent(rawSignedContent)');
    expect(admob).toContain('signedContentCandidates');
    expect(admob.indexOf('verification: true')).toBeLessThan(admob.indexOf('await verifyAdMobSignature'));
    expect(admob).toMatch(/verifyAdMobSignature[\s\S]+rewarded ad unit is not allowed[\s\S]+admin_process_ad_reward/);
    expect(admob).toContain('admin_process_ad_reward');
    const nativeAds = read('src/services/ads.native.tsx');
    expect(nativeAds).toContain('rewardedRequestOptions(userId, placement)');
    expect(nativeAds).toContain('ensureGuestSession()');
  });

  it('exposes verified purchase and advertisement rewards through one-time authenticated claims', () => {
    const purchases = read('supabase/migrations/20261107194500_secure_iap_claims.sql');
    const refunds = read('supabase/migrations/20261107213000_iap_refund_claims.sql');
    const ads = read('supabase/migrations/20261107214500_verified_ad_reward_claims.sql');
    expect(purchases).toContain('claim_iap_grants');
    expect(refunds).toContain('pe.currency_delta <> 0');
    expect(ads).toContain('claim_ad_rewards');
    expect(ads).toContain("ar.custom_data = 'Free $1,000 virtual cash'");
    expect(ads).toContain('grant execute on function public.claim_ad_rewards() to authenticated');
  });
});
