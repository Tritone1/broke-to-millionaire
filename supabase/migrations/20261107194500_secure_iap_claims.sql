alter table public.purchase_events
add column if not exists claimed_at timestamptz;

create table if not exists public.player_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_id text not null check (char_length(entitlement_id) between 2 and 64),
  active boolean not null default true,
  product_id text not null check (char_length(product_id) between 2 and 128),
  source_event_id text not null check (char_length(source_event_id) between 3 and 256),
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement_id)
);

alter table public.player_entitlements enable row level security;

create policy player_entitlements_select_own on public.player_entitlements
for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.player_entitlements from anon, authenticated;
grant select on public.player_entitlements to authenticated;

create or replace function public.claim_iap_grants()
returns table (amount text, claimed_count integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  return query
  with claimable as (
    select pe.event_id
    from public.purchase_events pe
    where pe.user_id = current_user_id
      and pe.status = 'processed'
      and pe.currency_delta > 0
      and pe.claimed_at is null
    for update skip locked
  ), marked as (
    update public.purchase_events pe
    set claimed_at = now()
    where pe.event_id in (select c.event_id from claimable c)
    returning pe.currency_delta
  )
  select coalesce(sum(m.currency_delta), 0)::text, count(*)::integer
  from marked m;
end;
$$;

revoke all on function public.claim_iap_grants() from public, anon;
grant execute on function public.claim_iap_grants() to authenticated;

create or replace function public.get_player_entitlements()
returns table (entitlement_id text, active boolean, product_id text, updated_at timestamptz)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select pe.entitlement_id, pe.active, pe.product_id, pe.updated_at
  from public.player_entitlements pe
  where pe.user_id = (select auth.uid());
$$;

revoke all on function public.get_player_entitlements() from public, anon;
grant execute on function public.get_player_entitlements() to authenticated;

create or replace function public.admin_set_player_entitlement(
  p_user_id uuid,
  p_entitlement_id text,
  p_active boolean,
  p_product_id text,
  p_source_event_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null
    or char_length(p_entitlement_id) not between 2 and 64
    or char_length(p_product_id) not between 2 and 128
    or char_length(p_source_event_id) not between 3 and 256 then
    raise exception 'invalid_entitlement' using errcode = '22023';
  end if;

  insert into public.player_entitlements (
    user_id, entitlement_id, active, product_id, source_event_id
  ) values (
    p_user_id, p_entitlement_id, p_active, p_product_id, p_source_event_id
  )
  on conflict (user_id, entitlement_id) do update
  set active = excluded.active,
      product_id = excluded.product_id,
      source_event_id = excluded.source_event_id,
      updated_at = now();
end;
$$;

revoke all on function public.admin_set_player_entitlement(uuid, text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.admin_set_player_entitlement(uuid, text, boolean, text, text) to service_role;
