-- Auto-Claim Jobs Migration for SHAH Wallet
-- Run this in your Supabase SQL editor to create the auto-claim functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-claim jobs table
CREATE TABLE IF NOT EXISTS auto_claim_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT UNIQUE NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled', 'paused')),
  last_claimed TIMESTAMP WITH TIME ZONE,
  last_attempt TIMESTAMP WITH TIME ZONE,
  total_claims INTEGER DEFAULT 0,
  total_rewards_claimed DECIMAL DEFAULT 0,
  total_fees_paid DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_claim_jobs_user_address ON auto_claim_jobs(user_address);
CREATE INDEX IF NOT EXISTS idx_auto_claim_jobs_status ON auto_claim_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auto_claim_jobs_last_claimed ON auto_claim_jobs(last_claimed);

-- Auto-claim execution logs table
CREATE TABLE IF NOT EXISTS auto_claim_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id TEXT NOT NULL,
  user_address TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  rewards_claimed DECIMAL NOT NULL,
  fee_paid DECIMAL NOT NULL,
  transaction_hash TEXT,
  block_number INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  gas_used INTEGER,
  gas_price DECIMAL,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for execution logs
CREATE INDEX IF NOT EXISTS idx_auto_claim_executions_user_address ON auto_claim_executions(user_address);
CREATE INDEX IF NOT EXISTS idx_auto_claim_executions_execution_id ON auto_claim_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_auto_claim_executions_status ON auto_claim_executions(status);
CREATE INDEX IF NOT EXISTS idx_auto_claim_executions_created_at ON auto_claim_executions(created_at);

-- Auto-claim settings table
CREATE TABLE IF NOT EXISTS auto_claim_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO auto_claim_settings (setting_key, setting_value, description) VALUES
  ('execution_fee', '0.1', 'Execution fee in SHAH tokens'),
  ('min_rewards_threshold', '0.05', 'Minimum rewards to trigger auto-claim'),
  ('batch_size', '50', 'Maximum users per batch execution'),
  ('execution_interval_hours', '1', 'How often to run auto-claim (in hours)'),
  ('max_gas_price', '50', 'Maximum gas price in gwei for auto-claim transactions'),
  ('enabled', 'true', 'Whether auto-claim is globally enabled')
ON CONFLICT (setting_key) DO NOTHING;

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE auto_claim_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_claim_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_claim_settings ENABLE ROW LEVEL SECURITY;

-- Auto-claim jobs policies
CREATE POLICY "Users can view their own auto-claim jobs" ON auto_claim_jobs
  FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "Users can insert their own auto-claim jobs" ON auto_claim_jobs
  FOR INSERT WITH CHECK (wallet_address = current_user);

CREATE POLICY "Users can update their own auto-claim jobs" ON auto_claim_jobs
  FOR UPDATE USING (wallet_address = current_user);

CREATE POLICY "Users can delete their own auto-claim jobs" ON auto_claim_jobs
  FOR DELETE USING (wallet_address = current_user);

-- Auto-claim executions policies
CREATE POLICY "Users can view their own execution logs" ON auto_claim_executions
  FOR SELECT USING (wallet_address = current_user);

CREATE POLICY "System can insert execution logs" ON auto_claim_executions
  FOR INSERT WITH CHECK (true);

-- Auto-claim settings policies (admin only)
CREATE POLICY "Only admins can view settings" ON auto_claim_settings
  FOR SELECT USING (false);

CREATE POLICY "Only admins can update settings" ON auto_claim_settings
  FOR ALL USING (false);

-- Functions for auto-claim management

-- Function to enable auto-claim for a user
CREATE OR REPLACE FUNCTION enable_auto_claim(user_wallet_address TEXT)
RETURNS UUID AS $$
DECLARE
  job_id UUID;
BEGIN
  INSERT INTO auto_claim_jobs (user_address, wallet_address, status)
  VALUES (user_wallet_address, user_wallet_address, 'enabled')
  ON CONFLICT (user_address) 
  DO UPDATE SET 
    status = 'enabled',
    updated_at = NOW()
  RETURNING id INTO job_id;
  
  RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable auto-claim for a user
CREATE OR REPLACE FUNCTION disable_auto_claim(user_wallet_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auto_claim_jobs 
  SET status = 'disabled', updated_at = NOW()
  WHERE wallet_address = user_wallet_address;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get users eligible for auto-claim
CREATE OR REPLACE FUNCTION get_eligible_users_for_auto_claim(
  max_users INTEGER DEFAULT 50,
  min_hours_since_last_claim INTEGER DEFAULT 1
)
RETURNS TABLE (
  user_address TEXT,
  wallet_address TEXT,
  last_claimed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    acj.user_address,
    acj.wallet_address,
    acj.last_claimed
  FROM auto_claim_jobs acj
  WHERE acj.status = 'enabled'
    AND (
      acj.last_claimed IS NULL 
      OR acj.last_claimed < NOW() - INTERVAL '1 hour' * min_hours_since_last_claim
    )
  ORDER BY acj.last_claimed ASC NULLS FIRST
  LIMIT max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log auto-claim execution
CREATE OR REPLACE FUNCTION log_auto_claim_execution(
  execution_id_param TEXT,
  user_address_param TEXT,
  wallet_address_param TEXT,
  rewards_claimed_param DECIMAL,
  fee_paid_param DECIMAL,
  transaction_hash_param TEXT DEFAULT NULL,
  block_number_param INTEGER DEFAULT NULL,
  status_param TEXT DEFAULT 'success',
  error_message_param TEXT DEFAULT NULL,
  gas_used_param INTEGER DEFAULT NULL,
  gas_price_param DECIMAL DEFAULT NULL,
  execution_time_ms_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO auto_claim_executions (
    execution_id,
    user_address,
    wallet_address,
    rewards_claimed,
    fee_paid,
    transaction_hash,
    block_number,
    status,
    error_message,
    gas_used,
    gas_price,
    execution_time_ms
  ) VALUES (
    execution_id_param,
    user_address_param,
    wallet_address_param,
    rewards_claimed_param,
    fee_paid_param,
    transaction_hash_param,
    block_number_param,
    status_param,
    error_message_param,
    gas_used_param,
    gas_price_param,
    execution_time_ms_param
  ) RETURNING id INTO log_id;
  
  -- Update auto_claim_jobs with latest execution info
  UPDATE auto_claim_jobs 
  SET 
    last_claimed = CASE WHEN status_param = 'success' THEN NOW() ELSE last_claimed END,
    last_attempt = NOW(),
    total_claims = total_claims + CASE WHEN status_param = 'success' THEN 1 ELSE 0 END,
    total_rewards_claimed = total_rewards_claimed + CASE WHEN status_param = 'success' THEN rewards_claimed_param ELSE 0 END,
    total_fees_paid = total_fees_paid + CASE WHEN status_param = 'success' THEN fee_paid_param ELSE 0 END,
    updated_at = NOW()
  WHERE wallet_address = wallet_address_param;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get auto-claim statistics
CREATE OR REPLACE FUNCTION get_auto_claim_stats()
RETURNS TABLE (
  total_users INTEGER,
  enabled_users INTEGER,
  disabled_users INTEGER,
  total_rewards_claimed DECIMAL,
  total_fees_paid DECIMAL,
  total_executions INTEGER,
  successful_executions INTEGER,
  failed_executions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_users,
    COUNT(*) FILTER (WHERE status = 'enabled')::INTEGER as enabled_users,
    COUNT(*) FILTER (WHERE status = 'disabled')::INTEGER as disabled_users,
    COALESCE(SUM(total_rewards_claimed), 0) as total_rewards_claimed,
    COALESCE(SUM(total_fees_paid), 0) as total_fees_paid,
    COALESCE(SUM(total_claims), 0)::INTEGER as total_executions,
    COUNT(*) FILTER (WHERE ace.status = 'success')::INTEGER as successful_executions,
    COUNT(*) FILTER (WHERE ace.status = 'failed')::INTEGER as failed_executions
  FROM auto_claim_jobs acj
  LEFT JOIN auto_claim_executions ace ON acj.wallet_address = ace.wallet_address;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_auto_claim_jobs_updated_at BEFORE UPDATE ON auto_claim_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_claim_settings_updated_at BEFORE UPDATE ON auto_claim_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert sample data for testing
INSERT INTO auto_claim_jobs (user_address, wallet_address, status) VALUES 
  ('0x1234567890123456789012345678901234567890', '0x1234567890123456789012345678901234567890', 'enabled'),
  ('0x0987654321098765432109876543210987654321', '0x0987654321098765432109876543210987654321', 'disabled')
ON CONFLICT (user_address) DO NOTHING;

-- Success message
SELECT 'Auto-claim migration completed successfully!' as status;
