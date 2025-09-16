-- Create staking_autoclaim table
CREATE TABLE IF NOT EXISTS staking_autoclaim (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    staking_contract TEXT NOT NULL,
    amount_claimed TEXT NOT NULL,
    amount_usd DECIMAL(20, 8),
    gas_used BIGINT,
    gas_price TEXT,
    transaction_hash TEXT,
    block_number BIGINT,
    network_id INTEGER NOT NULL DEFAULT 1,
    tier_at_claim INTEGER,
    apy_at_claim DECIMAL(5, 2),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_user_id ON staking_autoclaim(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_wallet_address ON staking_autoclaim(wallet_address);
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_network_id ON staking_autoclaim(network_id);
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_claimed_at ON staking_autoclaim(claimed_at);
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_transaction_hash ON staking_autoclaim(transaction_hash);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_wallet_network ON staking_autoclaim(wallet_address, network_id);
CREATE INDEX IF NOT EXISTS idx_staking_autoclaim_user_claimed ON staking_autoclaim(user_id, claimed_at);

-- Add RLS policies
ALTER TABLE staking_autoclaim ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own autoclaim records
CREATE POLICY "Users can view own staking autoclaim" ON staking_autoclaim
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own autoclaim records
CREATE POLICY "Users can insert own staking autoclaim" ON staking_autoclaim
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own autoclaim records
CREATE POLICY "Users can update own staking autoclaim" ON staking_autoclaim
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own autoclaim records
CREATE POLICY "Users can delete own staking autoclaim" ON staking_autoclaim
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_staking_autoclaim_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_staking_autoclaim_updated_at
    BEFORE UPDATE ON staking_autoclaim
    FOR EACH ROW
    EXECUTE FUNCTION update_staking_autoclaim_updated_at();

-- Create function to get autoclaim statistics
CREATE OR REPLACE FUNCTION get_staking_autoclaim_stats(
    p_wallet_address TEXT,
    p_network_id INTEGER DEFAULT 1,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_claimed TEXT,
    total_claimed_usd DECIMAL(20, 8),
    total_gas_used BIGINT,
    claim_count BIGINT,
    avg_apy DECIMAL(5, 2),
    last_claim_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount_claimed::NUMERIC), 0)::TEXT as total_claimed,
        COALESCE(SUM(amount_usd), 0) as total_claimed_usd,
        COALESCE(SUM(gas_used), 0) as total_gas_used,
        COUNT(*) as claim_count,
        COALESCE(AVG(apy_at_claim), 0) as avg_apy,
        MAX(claimed_at) as last_claim_at
    FROM staking_autoclaim
    WHERE wallet_address = p_wallet_address
        AND network_id = p_network_id
        AND claimed_at >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- Create function to get autoclaim history
CREATE OR REPLACE FUNCTION get_staking_autoclaim_history(
    p_wallet_address TEXT,
    p_network_id INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    amount_claimed TEXT,
    amount_usd DECIMAL(20, 8),
    gas_used BIGINT,
    transaction_hash TEXT,
    tier_at_claim INTEGER,
    apy_at_claim DECIMAL(5, 2),
    claimed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.amount_claimed,
        sa.amount_usd,
        sa.gas_used,
        sa.transaction_hash,
        sa.tier_at_claim,
        sa.apy_at_claim,
        sa.claimed_at
    FROM staking_autoclaim sa
    WHERE sa.wallet_address = p_wallet_address
        AND sa.network_id = p_network_id
    ORDER BY sa.claimed_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to get network autoclaim statistics
CREATE OR REPLACE FUNCTION get_network_staking_autoclaim_stats(
    p_network_id INTEGER DEFAULT 1,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_claimed TEXT,
    total_claimed_usd DECIMAL(20, 8),
    total_gas_used BIGINT,
    unique_users BIGINT,
    avg_apy DECIMAL(5, 2),
    total_claims BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount_claimed::NUMERIC), 0)::TEXT as total_claimed,
        COALESCE(SUM(amount_usd), 0) as total_claimed_usd,
        COALESCE(SUM(gas_used), 0) as total_gas_used,
        COUNT(DISTINCT wallet_address) as unique_users,
        COALESCE(AVG(apy_at_claim), 0) as avg_apy,
        COUNT(*) as total_claims
    FROM staking_autoclaim
    WHERE network_id = p_network_id
        AND claimed_at >= NOW() - INTERVAL '1 day' * p_days;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE staking_autoclaim IS 'Records of automatic staking reward claims';
COMMENT ON COLUMN staking_autoclaim.user_id IS 'Reference to auth.users table';
COMMENT ON COLUMN staking_autoclaim.wallet_address IS 'Wallet address that claimed rewards';
COMMENT ON COLUMN staking_autoclaim.staking_contract IS 'Address of the staking contract';
COMMENT ON COLUMN staking_autoclaim.amount_claimed IS 'Amount of tokens claimed (in wei)';
COMMENT ON COLUMN staking_autoclaim.amount_usd IS 'USD value of claimed amount';
COMMENT ON COLUMN staking_autoclaim.gas_used IS 'Gas used for the claim transaction';
COMMENT ON COLUMN staking_autoclaim.gas_price IS 'Gas price for the claim transaction (in wei)';
COMMENT ON COLUMN staking_autoclaim.transaction_hash IS 'Transaction hash of the claim';
COMMENT ON COLUMN staking_autoclaim.block_number IS 'Block number of the claim transaction';
COMMENT ON COLUMN staking_autoclaim.network_id IS 'Network ID (1=ETH, 137=Polygon, etc.)';
COMMENT ON COLUMN staking_autoclaim.tier_at_claim IS 'Staking tier at time of claim';
COMMENT ON COLUMN staking_autoclaim.apy_at_claim IS 'APY at time of claim';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staking_autoclaim TO authenticated;
GRANT USAGE ON SEQUENCE staking_autoclaim_id_seq TO authenticated; 