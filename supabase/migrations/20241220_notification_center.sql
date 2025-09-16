-- In-app notification center

-- Store individual notifications for each user
create table if not exists notif_events (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  type text not null, -- price_change, token_created, token_verified, token_blacklisted, custom_token_alert, broadcast
  payload jsonb not null,
  created_at timestamptz default now(),
  read boolean default false,
  read_at timestamptz
);

-- Indexes for performance
create index if not exists idx_notif_events_wallet on notif_events(wallet_address);
create index if not exists idx_notif_events_type on notif_events(type);
create index if not exists idx_notif_events_created_at on notif_events(created_at);
create index if not exists idx_notif_events_read on notif_events(read);
create index if not exists idx_notif_events_wallet_read on notif_events(wallet_address, read);

-- RLS policies
alter table notif_events enable row level security;

-- Users can only access their own notifications
create policy "Users can view own notifications" on notif_events
  for select using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

create policy "Users can update own notifications" on notif_events
  for update using (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Service role can insert notifications
create policy "Service role can insert notifications" on notif_events
  for insert using (current_setting('role') = 'service_role');

-- Function to update read timestamp
create or replace function update_notification_read_timestamp()
returns trigger as $$
begin
  if new.read = true and old.read = false then
    new.read_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_notification_read_timestamp_trigger
  before update on notif_events
  for each row execute function update_notification_read_timestamp();

-- Function to clean up old notifications (keep last 1000 per user)
create or replace function cleanup_old_notifications()
returns void as $$
declare
  user_wallet text;
begin
  for user_wallet in select distinct wallet_address from notif_events loop
    delete from notif_events 
    where wallet_address = user_wallet 
    and id not in (
      select id from notif_events 
      where wallet_address = user_wallet 
      order by created_at desc 
      limit 1000
    );
  end loop;
end;
$$ language plpgsql security definer;