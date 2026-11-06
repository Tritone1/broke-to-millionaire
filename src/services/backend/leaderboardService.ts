import type { LeaderboardEntry } from '../../data/leaderboard';
import { big } from '../../game/BigNumber';
import { getSupabaseClient } from './supabaseClient';

type LeaderboardRow = {
  user_id: string;
  display_name: string;
  net_worth: string | number;
  avatar: { emoji?: string } | null;
};

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
  const { data, error } = await client
    .from('leaderboard_scores')
    .select('user_id, display_name, net_worth, avatar')
    .order('net_worth', { ascending: false })
    .limit(safeLimit);
  if (error) throw error;

  return (data as LeaderboardRow[]).map((row) => ({
    id: row.user_id,
    name: row.display_name,
    worth: big(row.net_worth),
    avatar: row.avatar?.emoji ?? '⭐',
  }));
}
