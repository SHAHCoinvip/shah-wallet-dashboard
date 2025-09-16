-- Custom token alert subscriptions

-- Users can subscribe to alerts for specific ERC-20 tokens
create table if not exists token_subscriptions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  token_address text not null,
  alert_types jsonb default '["large_transfer", "volume_spike"]',
  min_amount_wei text default '0',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate subscriptions
  unique(wallet_address, token_address)
);

-- Token metrics cache (optional for volume tracking)
create table if not exists token_metrics (
  token_address text primary key,
  last_checked_block text default '0',
  last_24h_volume_usd numeric default 0,
  last_24h_transfer_count integer default 0,
  decimals integer,
  symbol text,
  name text,
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_token_subscriptions_wallet on token_subscriptions(wallet_address);
create index if not exists idx_token_subscriptions_token on token_subscriptions(token_address);
create index if not exists idx_token_subscriptions_types on token_subscriptions using gin(alert_types);
create index if not exists idx_token_metrics_updated on token_metrics(updated_at);

-- RLS policies
alter table token_subscriptions enable row level security;
alter table token_metrics enable row level security;

-- Users can only access their own token subscriptions
create policy "Users can view own token subscriptions" on token_subscriptions
  for select using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can insert own token subscriptions" on token_subscriptions
  for insert with check (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can update own token subscriptions" on token_subscriptions
  for update using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can delete own token subscriptions" on token_subscriptions
  for delete using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Service role can access token metrics
create policy "Service role can access token metrics" on token_metrics
  for all using (current_setting('role') = 'service_role');

-- Function to update token subscription timestamp
create or replace function update_token_subscription_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_token_subscription_timestamp_trigger
  before update on token_subscriptions
  for each row execute function update_token_subscription_timestamp();