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
    expect(revenueCat).toContain('admin_process_purchase_event');
    expect(admob).toContain('verifyAdMobSignature');
    expect(admob).toContain('ADMOB_REWARDED_AD_UNIT_IDS');
    expect(admob).toContain('admin_process_ad_reward');
  });
});
