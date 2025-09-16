-- SHAH Telegram Mini-App PRO Database Migrations
-- Run these in your Supabase SQL editor

-- Users table (if not exists)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique,            -- lowercased EVM address
  created_at timestamptz default now()
);

-- Telegram link table (if not exists)
create table if not exists telegram_links (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  tg_user_id bigint unique,
  tg_username text,
  linked_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- User settings table (if not exists)
create table if not exists user_settings (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  notifications_enabled boolean default true,
  telegram_notifications boolean default true,
  price_alerts boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Referral links & attributions
create table if not exists referrals (
  id bigserial primary key,
  ref_code text unique,                  -- short code (A-Z2-9)
  inviter_user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  active boolean default true
);

create table if not exists referral_events (
  id bigserial primary key,
  ref_code text,
  invitee_tg_user_id bigint,
  invitee_wallet_address text,
  action text check (action in ('joined','first_swap','first_stake','invoice_paid')),
  metadata jsonb,
  created_at timestamptz default now()
);

-- Create index for referral events
create index if not exists idx_ref_events_code on referral_events(ref_code);
create index if not exists idx_ref_events_invitee on referral_events(invitee_tg_user_id);

-- Merchant invoices (on/off-chain)
create table if not exists merchants (
  id bigserial primary key,
  owner_user_id uuid references users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  wallet_address text,                   -- merchant's treasury wallet
  preferred_currency text default 'USD', -- USD or SHAH
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id bigserial primary key,
  merchant_id bigint references merchants(id) on delete cascade,
  invoice_id text unique,                -- public id (e.g., INV-ABC123)
  amount_usd numeric(18,2) not null,
  amount_shah numeric(78,0),             -- in wei (or bigint in app layer)
  payer_wallet text,
  status text check (status in ('pending','paid','expired','refunded')) default 'pending',
  provider text,                         -- telegram|stripe|onchain
  ref_code text,                         -- optional referral tie-in
  description text,
  created_at timestamptz default now(),
  paid_at timestamptz,
  expires_at timestamptz default (now() + interval '24 hours')
);

-- Create indexes for invoices
create index if not exists idx_invoices_invoice_id on invoices(invoice_id);
create index if not exists idx_invoices_merchant_id on invoices(merchant_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_created_at on invoices(created_at);

-- Portfolio tracking (optional - for caching)
create table if not exists portfolio_snapshots (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  wallet_address text not null,
  eth_balance text,                      -- in wei
  shah_balance text,                     -- in wei
  staked_amount text,                    -- in wei
  pending_rewards text,                  -- in wei
  current_tier integer default 0,
  total_usd numeric(18,2),
  snapshot_at timestamptz default now()
);

create index if not exists idx_portfolio_user on portfolio_snapshots(user_id);
create index if not exists idx_portfolio_wallet on portfolio_snapshots(wallet_address);
create index if not exists idx_portfolio_snapshot_at on portfolio_snapshots(snapshot_at);

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
alter table users enable row level security;
alter table telegram_links enable row level security;
alter table user_settings enable row level security;
alter table referrals enable row level security;
alter table referral_events enable row level security;
alter table merchants enable row level security;
alter table invoices enable row level security;
alter table portfolio_snapshots enable row level security;

-- Users policies
create policy "Users can view their own data" on users
  for select using (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

create policy "Users can insert their own data" on users
  for insert with check (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Telegram links policies
create policy "Users can view their own telegram links" on telegram_links
  for select using (user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

create policy "Users can insert their own telegram links" on telegram_links
  for insert with check (user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

-- Referrals policies
create policy "Users can view their own referrals" on referrals
  for select using (inviter_user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

create policy "Users can create their own referrals" on referrals
  for insert with check (inviter_user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

-- Referral events policies (read-only for users, full access for service role)
create policy "Users can view referral events" on referral_events
  for select using (true);

create policy "Service role can manage referral events" on referral_events
  for all using (auth.role() = 'service_role');

-- Merchants policies
create policy "Users can view their own merchants" on merchants
  for select using (owner_user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

create policy "Users can create their own merchants" on merchants
  for insert with check (owner_user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

create policy "Users can update their own merchants" on merchants
  for update using (owner_user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

-- Invoices policies
create policy "Users can view their own invoices" on invoices
  for select using (merchant_id in (
    select id from merchants where owner_user_id in (
      select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
    )
  ));

create policy "Users can create invoices for their merchants" on invoices
  for insert with check (merchant_id in (
    select id from merchants where owner_user_id in (
      select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
    )
  ));

create policy "Service role can update invoices" on invoices
  for update using (auth.role() = 'service_role');

-- Portfolio snapshots policies
create policy "Users can view their own portfolio snapshots" on portfolio_snapshots
  for select using (user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

create policy "Users can insert their own portfolio snapshots" on portfolio_snapshots
  for insert with check (user_id in (
    select id from users where wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address'
  ));

-- Functions for common operations

-- Function to generate referral code
create or replace function generate_referral_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  end loop;
  return result;
end;
$$;

-- Function to create user and telegram link
create or replace function create_user_with_telegram(
  p_wallet_address text,
  p_tg_user_id bigint,
  p_tg_username text
)
returns uuid
language plpgsql
as $$
declare
  v_user_id uuid;
begin
  -- Insert or get user
  insert into users (wallet_address)
  values (lower(p_wallet_address))
  on conflict (wallet_address) do update set wallet_address = excluded.wallet_address
  returning id into v_user_id;
  
  -- Insert or update telegram link
  insert into telegram_links (user_id, tg_user_id, tg_username)
  values (v_user_id, p_tg_user_id, p_tg_username)
  on conflict (tg_user_id) do update set
    user_id = excluded.user_id,
    tg_username = excluded.tg_username,
    last_seen = now();
  
  return v_user_id;
end;
$$;

-- Function to record referral event
create or replace function record_referral_event(
  p_ref_code text,
  p_invitee_tg_user_id bigint,
  p_invitee_wallet_address text,
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
as $$
begin
  -- Check if referral code exists and is active
  if not exists (
    select 1 from referrals 
    where ref_code = upper(p_ref_code) and active = true
  ) then
    return false;
  end if;
  
  -- Check for duplicate events
  if exists (
    select 1 from referral_events
    where ref_code = upper(p_ref_code)
      and invitee_tg_user_id = p_invitee_tg_user_id
      and action = p_action
  ) then
    return true; -- Already recorded
  end if;
  
  -- Insert event
  insert into referral_events (
    ref_code, invitee_tg_user_id, invitee_wallet_address, action, metadata
  ) values (
    upper(p_ref_code), p_invitee_tg_user_id, p_invitee_wallet_address, p_action, p_metadata
  );
  
  return true;
end;
$$;

-- Function to get referral stats
create or replace function get_referral_stats(p_ref_code text)
returns table(
  total_invites bigint,
  joined bigint,
  first_swap bigint,
  first_stake bigint,
  invoice_paid bigint
)
language sql
as $$
  select
    count(*) as total_invites,
    count(*) filter (where action = 'joined') as joined,
    count(*) filter (where action = 'first_swap') as first_swap,
    count(*) filter (where action = 'first_stake') as first_stake,
    count(*) filter (where action = 'invoice_paid') as invoice_paid
  from referral_events
  where ref_code = upper(p_ref_code);
$$;

-- Function to update invoice status
create or replace function update_invoice_status(
  p_invoice_id text,
  p_status text,
  p_payer_wallet text default null
)
returns boolean
language plpgsql
as $$
begin
  update invoices
  set 
    status = p_status,
    payer_wallet = coalesce(p_payer_wallet, payer_wallet),
    paid_at = case when p_status = 'paid' then now() else paid_at end
  where invoice_id = p_invoice_id;
  
  return found;
end;
$$;

-- Create some sample data for testing (optional)
-- Uncomment these lines to add sample data

/*
-- Sample merchant
insert into merchants (owner_user_id, name, slug, wallet_address) 
values (
  (select id from users limit 1),
  'SHAH Coffee Shop',
  'shah-coffee',
  '0x1234567890123456789012345678901234567890'
);

-- Sample referral
insert into referrals (ref_code, inviter_user_id)
values (
  'ABC12345',
  (select id from users limit 1)
);
*/ 