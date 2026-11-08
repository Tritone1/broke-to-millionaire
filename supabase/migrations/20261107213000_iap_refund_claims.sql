create or replace function public.claim_iap_grants()
returns table (amount text, claimed_count integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  with marked as (
    update public.purchase_events pe
    set claimed_at = now()
    where pe.user_id = auth.uid()
      and pe.claimed_at is null
      and pe.currency_delta <> 0
    returning pe.currency_delta
  )
  select coalesce(sum(m.currency_delta), 0)::text, count(*)::integer
  from marked m;
$$;

revoke all on function public.claim_iap_grants() from public, anon;
grant execute on function public.claim_iap_grants() to authenticated;
