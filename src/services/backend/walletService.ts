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
