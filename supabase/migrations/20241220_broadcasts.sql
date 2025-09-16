-- Admin broadcast system

-- Broadcasts sent by admins to all subscribers
create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  sent_by text not null,
  sent_at timestamptz,
  channels text[] default '{telegram,email}',
  status text default 'queued', -- queued, sending, sent, failed
  recipient_count integer default 0,
  success_count integer default 0,
  failure_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_broadcasts_status on broadcasts(status);
create index if not exists idx_broadcasts_sent_by on broadcasts(sent_by);
create index if not exists idx_broadcasts_created_at on broadcasts(created_at);

-- RLS policies
alter table broadcasts enable row level security;

-- Only admins can access broadcasts
create policy "Admin only access to broadcasts" on broadcasts
  for all using (
    sent_by = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    OR current_setting('role') = 'service_role'
  );

-- Function to update broadcast timestamp
create or replace function update_broadcast_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_broadcast_timestamp_trigger
  before update on broadcasts
  for each row execute function update_broadcast_timestamp();