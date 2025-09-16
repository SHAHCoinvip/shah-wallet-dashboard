-- SHAH Wallet Supabase Database Migration
-- Run this in your Supabase SQL editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  chain_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- 2. User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  telegram_id TEXT,
  preferences JSONB DEFAULT '{"notifications_enabled": true, "default_chain": 1, "theme": "dark"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);

-- 3. Staking logs table
CREATE TABLE IF NOT EXISTS staking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  token_address TEXT,
  action TEXT CHECK (action IN ('stake', 'unstake', 'claim')),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for staking logs
CREATE INDEX IF NOT EXISTS idx_staking_logs_user_id ON staking_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_logs_created_at ON staking_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_staking_logs_action ON staking_logs(action);

-- 4. Portfolio snapshots table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  portfolio_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for portfolio snapshots
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_wallet_address ON portfolio_snapshots(wallet_address);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_created_at ON portfolio_snapshots(created_at);

-- 5. User actions table (analytics)
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user actions
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action ON user_actions(action);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- 6. System events table (admin/monitoring)
CREATE TABLE IF NOT EXISTS system_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system events
CREATE INDEX IF NOT EXISTS idx_system_events_event ON system_events(event);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);

-- 7. Transactions table (blockchain tx tracking)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_chain_id ON transactions(chain_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- 8. Portfolio sync table (for backend sync operations)
CREATE TABLE IF NOT EXISTS portfolio_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  portfolio_data JSONB NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for portfolio sync
CREATE INDEX IF NOT EXISTS idx_portfolio_sync_wallet_address ON portfolio_sync(wallet_address);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sync ENABLE ROW LEVEL SECURITY;

-- Wallets policies
CREATE POLICY "Users can view their own wallets" ON wallets
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own wallets" ON wallets
  FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own wallets" ON wallets
  FOR UPDATE USING (user_id = current_user);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (wallet_address = current_user);

-- Staking logs policies
CREATE POLICY "Users can view their own staking logs" ON staking_logs
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own staking logs" ON staking_logs
  FOR INSERT WITH CHECK (user_id = current_user);

-- Portfolio snapshots policies
CREATE POLICY "Users can view their own portfolio snapshots" ON portfolio_snapshots
  FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "Users can insert their own portfolio snapshots" ON portfolio_snapshots
  FOR INSERT WITH CHECK (wallet_address = current_user);

-- User actions policies
CREATE POLICY "Users can view their own actions" ON user_actions
  FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own actions" ON user_actions
  FOR INSERT WITH CHECK (user_id = current_user);

-- System events (admin only - no public access)
CREATE POLICY "No public access to system events" ON system_events
  FOR ALL USING (false);

-- Transactions policies
CREATE POLICY "Users can view all transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- Portfolio sync policies
CREATE POLICY "Users can view their own sync data" ON portfolio_sync
  FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "Users can upsert their own sync data" ON portfolio_sync
  FOR ALL USING (wallet_address = current_user);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at updates
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert some sample data for testing
INSERT INTO system_events (event, metadata) VALUES 
  ('migration_completed', '{"version": "1.0.0", "tables_created": 8}'),
  ('database_initialized', '{"timestamp": "' || NOW() || '"}')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'SHAH Wallet database migration completed successfully!' as status;
