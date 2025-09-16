-- Notification system tables for SHAH Web3 Wallet

-- Who wants which alerts and where to notify
create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  email text,
  telegram_user_id text,       -- e.g., "123456789"
  wants_price boolean default true,
  wants_new_tokens boolean default true,
  wants_verifications boolean default true,
  price_threshold_pct numeric default 5,      -- notify if abs change >= %
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Map Telegram link codes to wallets for secure binding
create table if not exists telegram_links (
  code text primary key,          -- short nonce, e.g., 6-8 chars
  wallet_address text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '1 hour')  -- links expire after 1 hour
);

-- Store last processed block/price to prevent duplicate alerts
create table if not exists notif_state (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Activity log for audit trail
create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  type text not null,           -- 'price', 'new_token', 'verified', 'blacklisted'
  payload jsonb not null,       -- event details
  recipients integer default 0, -- number of users notified
  sent_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_user_subscriptions_wallet on user_subscriptions(wallet_address);
create index if not exists idx_user_subscriptions_telegram on user_subscriptions(telegram_user_id);
create index if not exists idx_telegram_links_wallet on telegram_links(wallet_address);
create index if not exists idx_telegram_links_expires on telegram_links(expires_at);
create index if not exists idx_notification_log_type on notification_log(type);
create index if not exists idx_notification_log_sent_at on notification_log(sent_at);

-- Seed initial state
insert into notif_state(key, value) values
  ('factory_last_block', '21467000'),      -- Recent mainnet block
  ('registry_last_block', '21467000'),
  ('last_price_usd_1e8', '0'),            -- Price in 1e8 format (8 decimals)
  ('last_price_check', '0')               -- Timestamp of last price check
on conflict (key) do nothing;

-- RLS policies for security
alter table user_subscriptions enable row level security;
alter table telegram_links enable row level security;
alter table notif_state enable row level security;
alter table notification_log enable row level security;

-- Users can only access their own subscriptions
create policy "Users can view own subscriptions" on user_subscriptions
  for select using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can update own subscriptions" on user_subscriptions
  for update using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can insert own subscriptions" on user_subscriptions
  for insert with check (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Only service role can access telegram_links and notif_state
create policy "Service role only" on telegram_links for all using (current_setting('role') = 'service_role');
create policy "Service role only" on notif_state for all using (current_setting('role') = 'service_role');
create policy "Service role only" on notification_log for all using (current_setting('role') = 'service_role');

-- Function to clean up expired telegram links
create or replace function cleanup_expired_telegram_links()
returns void as $$
begin
  delete from telegram_links where expires_at < now();
end;
$$ language plpgsql security definer;

-- Function to update subscription updated_at timestamp
create or replace function update_subscription_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_subscription_timestamp_trigger
  before update on user_subscriptions
  for each row execute function update_subscription_timestamp();