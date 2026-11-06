create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Player' check (char_length(display_name) between 2 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(78, 0) not null default 0 check (balance >= 0),
  revision bigint not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('rewarded_ad', 'iap', 'refund', 'support', 'migration', 'gameplay')),
  amount numeric(78, 0) not null check (amount <> 0),
  balance_after numeric(78, 0) not null check (balance_after >= 0),
  external_transaction_id text not null unique check (char_length(external_transaction_id) between 3 and 256),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.purchase_events (
  event_id text primary key check (char_length(event_id) between 3 and 256),
  user_id uuid not null references auth.users(id) on delete cascade,
  store text not null check (store in ('app_store', 'play_store', 'revenuecat', 'test')),
  product_id text not null check (char_length(product_id) between 2 and 128),
  event_type text not null check (char_length(event_type) between 2 and 64),
  status text not null check (status in ('processed', 'refunded', 'rejected')),
  currency_delta numeric(78, 0) not null,
  environment text not null check (environment in ('sandbox', 'production')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.ad_reward_claims (
  transaction_id text primary key check (char_length(transaction_id) between 3 and 256),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_unit_id text not null check (char_length(ad_unit_id) between 3 and 256),
  reward_type text not null default 'virtual_cash' check (char_length(reward_type) between 2 and 64),
  reward_amount numeric(78, 0) not null check (reward_amount > 0),
  custom_data text,
  verified_at timestamptz not null default now()
);

create table public.cloud_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision >= 1),
  save_version integer not null check (save_version > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  checksum text not null check (char_length(checksum) between 8 and 128),
  device_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leaderboard_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  net_worth numeric(78, 0) not null default 0 check (net_worth >= 0),
  rank_title text not null default 'Broke' check (char_length(rank_title) between 2 and 40),
  avatar jsonb not null default '{}'::jsonb check (jsonb_typeof(avatar) = 'object'),
  verified_at timestamptz not null default now()
);

create index wallet_ledger_user_created_idx on public.wallet_ledger (user_id, created_at desc);
create index purchase_events_user_created_idx on public.purchase_events (user_id, created_at desc);
create index ad_reward_claims_user_verified_idx on public.ad_reward_claims (user_id, verified_at desc);
create index leaderboard_net_worth_idx on public.leaderboard_scores (net_worth desc, verified_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create trigger cloud_saves_set_updated_at
before update on public.cloud_saves
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_name text;
begin
  requested_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
  if requested_name is null or char_length(requested_name) not between 2 and 24 then
    requested_name := 'Player';
  end if;

  insert into public.profiles (user_id, display_name)
  values (new.id, requested_name)
  on conflict (user_id) do nothing;

  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (user_id, display_name)
select id, 'Player' from auth.users
on conflict (user_id) do nothing;

insert into public.wallets (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.purchase_events enable row level security;
alter table public.ad_reward_claims enable row level security;
alter table public.cloud_saves enable row level security;
alter table public.leaderboard_scores enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy wallets_select_own on public.wallets
for select to authenticated using ((select auth.uid()) = user_id);

create policy wallet_ledger_select_own on public.wallet_ledger
for select to authenticated using ((select auth.uid()) = user_id);

create policy purchase_events_select_own on public.purchase_events
for select to authenticated using ((select auth.uid()) = user_id);

create policy ad_reward_claims_select_own on public.ad_reward_claims
for select to authenticated using ((select auth.uid()) = user_id);

create policy cloud_saves_select_own on public.cloud_saves
for select to authenticated using ((select auth.uid()) = user_id);

create policy leaderboard_read on public.leaderboard_scores
for select to anon, authenticated using (true);

revoke all on public.profiles from anon, authenticated;
revoke all on public.wallets from anon, authenticated;
revoke all on public.wallet_ledger from anon, authenticated;
revoke all on public.purchase_events from anon, authenticated;
revoke all on public.ad_reward_claims from anon, authenticated;
revoke all on public.cloud_saves from anon, authenticated;
revoke all on public.leaderboard_scores from anon, authenticated;

grant select, update (display_name) on public.profiles to authenticated;
grant select on public.wallets to authenticated;
grant select on public.wallet_ledger to authenticated;
grant select on public.purchase_events to authenticated;
grant select on public.ad_reward_claims to authenticated;
grant select on public.cloud_saves to authenticated;
grant select on public.leaderboard_scores to anon, authenticated;

create or replace function public.get_wallet()
returns table (balance text, revision bigint, updated_at timestamptz)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select w.balance::text, w.revision, w.updated_at
  from public.wallets w
  where w.user_id = (select auth.uid());
$$;

revoke all on function public.get_wallet() from public, anon;
grant execute on function public.get_wallet() to authenticated;

create or replace function public.sync_cloud_save(
  p_expected_revision bigint,
  p_save_version integer,
  p_payload jsonb,
  p_checksum text,
  p_device_updated_at timestamptz default null
)
returns table (revision bigint, save_version integer, payload jsonb, checksum text, updated_at timestamptz)
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
  if p_expected_revision < 0 or p_save_version <= 0 then
    raise exception 'invalid_save_version' using errcode = '22023';
  end if;
  if jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text) > 1048576 then
    raise exception 'invalid_save_payload' using errcode = '22023';
  end if;
  if char_length(p_checksum) not between 8 and 128 then
    raise exception 'invalid_save_checksum' using errcode = '22023';
  end if;

  if p_expected_revision = 0 then
    insert into public.cloud_saves (user_id, revision, save_version, payload, checksum, device_updated_at)
    values (current_user_id, 1, p_save_version, p_payload, p_checksum, p_device_updated_at)
    on conflict (user_id) do nothing;
  else
    update public.cloud_saves cs
    set revision = cs.revision + 1,
        save_version = p_save_version,
        payload = p_payload,
        checksum = p_checksum,
        device_updated_at = p_device_updated_at
    where cs.user_id = current_user_id
      and cs.revision = p_expected_revision;
  end if;

  if not found then
    raise exception 'save_conflict' using errcode = '40001';
  end if;

  return query
  select cs.revision, cs.save_version, cs.payload, cs.checksum, cs.updated_at
  from public.cloud_saves cs
  where cs.user_id = current_user_id;
end;
$$;

revoke all on function public.sync_cloud_save(bigint, integer, jsonb, text, timestamptz) from public, anon;
grant execute on function public.sync_cloud_save(bigint, integer, jsonb, text, timestamptz) to authenticated;

create or replace function public.admin_grant_wallet_credit(
  p_user_id uuid,
  p_source text,
  p_amount numeric,
  p_external_transaction_id text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (balance text, revision bigint, applied_amount text, duplicate boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_balance numeric(78, 0);
  next_balance numeric(78, 0);
  next_revision bigint;
  actual_delta numeric(78, 0);
  prior public.wallet_ledger%rowtype;
begin
  if p_user_id is null or p_amount = 0 or trunc(p_amount) <> p_amount then
    raise exception 'invalid_wallet_grant' using errcode = '22023';
  end if;
  if p_source not in ('rewarded_ad', 'iap', 'refund', 'support', 'migration', 'gameplay') then
    raise exception 'invalid_wallet_source' using errcode = '22023';
  end if;
  if char_length(p_external_transaction_id) not between 3 and 256 then
    raise exception 'invalid_transaction_id' using errcode = '22023';
  end if;
  if jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'invalid_metadata' using errcode = '22023';
  end if;

  select * into prior
  from public.wallet_ledger
  where external_transaction_id = p_external_transaction_id;

  if found then
    if prior.user_id <> p_user_id then
      raise exception 'transaction_owner_mismatch' using errcode = '23505';
    end if;
    return query select prior.balance_after::text, w.revision, prior.amount::text, true
    from public.wallets w where w.user_id = p_user_id;
    return;
  end if;

  insert into public.wallets (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select w.balance into current_balance
  from public.wallets w
  where w.user_id = p_user_id
  for update;

  next_balance := greatest(0, current_balance + p_amount);
  actual_delta := next_balance - current_balance;
  if actual_delta = 0 then
    return query select current_balance::text, w.revision, '0'::text, false
    from public.wallets w where w.user_id = p_user_id;
    return;
  end if;

  update public.wallets w
  set balance = next_balance,
      revision = w.revision + 1
  where w.user_id = p_user_id
  returning w.revision into next_revision;

  insert into public.wallet_ledger (
    user_id, source, amount, balance_after, external_transaction_id, metadata
  ) values (
    p_user_id, p_source, actual_delta, next_balance, p_external_transaction_id, p_metadata
  );

  return query select next_balance::text, next_revision, actual_delta::text, false;
end;
$$;

revoke all on function public.admin_grant_wallet_credit(uuid, text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_grant_wallet_credit(uuid, text, numeric, text, jsonb) to service_role;

create or replace function public.admin_process_purchase_event(
  p_event_id text,
  p_user_id uuid,
  p_store text,
  p_product_id text,
  p_event_type text,
  p_currency_delta numeric,
  p_environment text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (balance text, revision bigint, applied_amount text, duplicate boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_store not in ('app_store', 'play_store', 'revenuecat', 'test') then
    raise exception 'invalid_store' using errcode = '22023';
  end if;
  if p_environment not in ('sandbox', 'production') then
    raise exception 'invalid_environment' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.purchase_events pe
    where pe.event_id = p_event_id and pe.user_id <> p_user_id
  ) then
    raise exception 'purchase_owner_mismatch' using errcode = '23505';
  end if;

  if exists (select 1 from public.purchase_events pe where pe.event_id = p_event_id) then
    return query
    select w.balance::text, w.revision, '0'::text, true
    from public.wallets w where w.user_id = p_user_id;
    return;
  end if;

  insert into public.purchase_events (
    event_id, user_id, store, product_id, event_type, status, currency_delta, environment, metadata
  ) values (
    p_event_id,
    p_user_id,
    p_store,
    p_product_id,
    p_event_type,
    case when p_currency_delta < 0 then 'refunded' else 'processed' end,
    p_currency_delta,
    p_environment,
    p_metadata
  );

  return query
  select * from public.admin_grant_wallet_credit(
    p_user_id,
    case when p_currency_delta < 0 then 'refund' else 'iap' end,
    p_currency_delta,
    'purchase:' || p_event_id,
    jsonb_build_object('product_id', p_product_id, 'event_type', p_event_type)
  );
end;
$$;

revoke all on function public.admin_process_purchase_event(text, uuid, text, text, text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_process_purchase_event(text, uuid, text, text, text, numeric, text, jsonb) to service_role;

create or replace function public.admin_process_ad_reward(
  p_transaction_id text,
  p_user_id uuid,
  p_ad_unit_id text,
  p_reward_amount numeric,
  p_custom_data text default null
)
returns table (balance text, revision bigint, applied_amount text, duplicate boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_reward_amount <= 0 or trunc(p_reward_amount) <> p_reward_amount then
    raise exception 'invalid_ad_reward' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.ad_reward_claims ar
    where ar.transaction_id = p_transaction_id and ar.user_id <> p_user_id
  ) then
    raise exception 'ad_reward_owner_mismatch' using errcode = '23505';
  end if;

  if exists (select 1 from public.ad_reward_claims ar where ar.transaction_id = p_transaction_id) then
    return query
    select w.balance::text, w.revision, '0'::text, true
    from public.wallets w where w.user_id = p_user_id;
    return;
  end if;

  insert into public.ad_reward_claims (
    transaction_id, user_id, ad_unit_id, reward_amount, custom_data
  ) values (
    p_transaction_id, p_user_id, p_ad_unit_id, p_reward_amount, p_custom_data
  );

  return query
  select * from public.admin_grant_wallet_credit(
    p_user_id,
    'rewarded_ad',
    p_reward_amount,
    'admob:' || p_transaction_id,
    jsonb_build_object('ad_unit_id', p_ad_unit_id, 'reward_type', 'virtual_cash')
  );
end;
$$;

revoke all on function public.admin_process_ad_reward(text, uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_process_ad_reward(text, uuid, text, numeric, text) to service_role;

create or replace function public.admin_upsert_leaderboard_score(
  p_user_id uuid,
  p_net_worth numeric,
  p_rank_title text,
  p_avatar jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  player_name text;
begin
  if p_net_worth < 0 or trunc(p_net_worth) <> p_net_worth then
    raise exception 'invalid_net_worth' using errcode = '22023';
  end if;
  select display_name into player_name from public.profiles where user_id = p_user_id;
  if player_name is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  insert into public.leaderboard_scores (user_id, display_name, net_worth, rank_title, avatar)
  values (p_user_id, player_name, p_net_worth, p_rank_title, p_avatar)
  on conflict (user_id) do update
  set display_name = excluded.display_name,
      net_worth = excluded.net_worth,
      rank_title = excluded.rank_title,
      avatar = excluded.avatar,
      verified_at = now();
end;
$$;

revoke all on function public.admin_upsert_leaderboard_score(uuid, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_upsert_leaderboard_score(uuid, numeric, text, jsonb) to service_role;
