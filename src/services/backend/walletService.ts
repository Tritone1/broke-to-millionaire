import { requireSupabaseClient } from './supabaseClient';

export type ServerWallet = {
  balance: string;
  revision: number;
  updatedAt: string;
};

type WalletRpcRow = {
  balance: string;
  revision: number;
  updated_at: string;
};

export async function fetchServerWallet(): Promise<ServerWallet> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('get_wallet');
  if (error) throw error;

  const row = (data as WalletRpcRow[] | null)?.[0];
  if (!row) throw new Error('The authenticated player does not have a server wallet.');
  return { balance: row.balance, revision: row.revision, updatedAt: row.updated_at };
}

type IapClaimRpcRow = {
  amount: string;
  claimed_count: number;
};

export async function claimIapGrants(): Promise<{ amount: number; claimedCount: number }> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('claim_iap_grants');
  if (error) throw error;

  const row = (data as IapClaimRpcRow[] | null)?.[0];
  const amount = Number(row?.amount ?? 0);
  if (!Number.isSafeInteger(amount)) throw new Error('The server returned an invalid purchase adjustment.');
  return { amount, claimedCount: row?.claimed_count ?? 0 };
}

export async function claimAdRewards(): Promise<{ amount: number; claimedCount: number }> {
  const client = requireSupabaseClient();
  const { data, error } = await client.rpc('claim_ad_rewards');
  if (error) throw error;

  const row = (data as IapClaimRpcRow[] | null)?.[0];
  const amount = Number(row?.amount ?? 0);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('The server returned an invalid advertisement reward.');
  return { amount, claimedCount: row?.claimed_count ?? 0 };
}
