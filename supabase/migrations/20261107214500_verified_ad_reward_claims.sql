alter table public.ad_reward_claims
  add column if not exists claimed_at timestamptz;

create or replace function public.claim_ad_rewards()
returns table (amount text, claimed_count integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  with marked as (
    update public.ad_reward_claims ar
    set claimed_at = now()
    where ar.user_id = auth.uid()
      and ar.claimed_at is null
      and ar.custom_data = 'Free $1,000 virtual cash'
    returning ar.reward_amount
  )
  select coalesce(sum(m.reward_amount), 0)::text, count(*)::integer
  from marked m;
$$;

revoke all on function public.claim_ad_rewards() from public, anon;
grant execute on function public.claim_ad_rewards() to authenticated;
