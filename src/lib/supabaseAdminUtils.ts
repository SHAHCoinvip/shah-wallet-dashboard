import { supabaseAdmin } from './supabaseAdmin'
import type { StakingLog, UserProfile } from './supabaseAdmin'

// Secure staking operations (backend-only)
export async function logStaking(userId: string, amount: number, tokenAddress?: string, txHash?: string) {
  const { data, error } = await supabaseAdmin
    .from('staking_logs')
    .insert({ 
      user_id: userId, 
      amount, 
      token_address: tokenAddress,
      action: 'stake',
      tx_hash: txHash,
      created_at: new Date().toISOString() 
    })
    .select()

  if (error) {
    console.error('Error logging staking:', error)
    throw error
  }

  return data?.[0] as StakingLog
}

export async function logUnstaking(userId: string, amount: number, tokenAddress?: string, txHash?: string) {
  const { data, error } = await supabaseAdmin
    .from('staking_logs')
    .insert({ 
      user_id: userId, 
      amount, 
      token_address: tokenAddress,
      action: 'unstake',
      tx_hash: txHash,
      created_at: new Date().toISOString() 
    })
    .select()

  if (error) {
    console.error('Error logging unstaking:', error)
    throw error
  }

  return data?.[0] as StakingLog
}

export async function logClaim(userId: string, amount: number, tokenAddress?: string, txHash?: string) {
  const { data, error } = await supabaseAdmin
    .from('staking_logs')
    .insert({ 
      user_id: userId, 
      amount, 
      token_address: tokenAddress,
      action: 'claim',
      tx_hash: txHash,
      created_at: new Date().toISOString() 
    })
    .select()

  if (error) {
    console.error('Error logging claim:', error)
    throw error
  }

  return data?.[0] as StakingLog
}

// User management (backend-only)
export async function createUserProfileAdmin(walletAddress: string, telegramId?: string) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      telegram_id: telegramId,
      preferences: {
        notifications_enabled: true,
        default_chain: 1,
        theme: 'dark'
      }
    })
    .select()

  if (error) {
    console.error('Error creating user profile (admin):', error)
    throw error
  }

  return data?.[0] as UserProfile
}

export async function updateUserProfileAdmin(walletAddress: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .update({ 
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress.toLowerCase())
    .select()

  if (error) {
    console.error('Error updating user profile (admin):', error)
    throw error
  }

  return data?.[0] as UserProfile
}

// Analytics and monitoring (backend-only)
export async function logSystemEvent(event: string, metadata?: any) {
  const { error } = await supabaseAdmin
    .from('system_events')
    .insert({
      event,
      metadata,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error logging system event:', error)
    throw error
  }
}

export async function logTransaction(txHash: string, chainId: number, metadata?: any) {
  const { error } = await supabaseAdmin
    .from('transactions')
    .insert({
      tx_hash: txHash,
      chain_id: chainId,
      metadata,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error logging transaction:', error)
    throw error
  }
}

// Portfolio sync (backend-only)
export async function syncPortfolioData(walletAddress: string, portfolioData: any) {
  const { error } = await supabaseAdmin
    .from('portfolio_sync')
    .upsert({
      wallet_address: walletAddress.toLowerCase(),
      portfolio_data: portfolioData,
      last_synced: new Date().toISOString()
    })

  if (error) {
    console.error('Error syncing portfolio data:', error)
    throw error
  }
}

// Get staking history for a user
export async function getStakingHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabaseAdmin
    .from('staking_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching staking history:', error)
    throw error
  }

  return data as StakingLog[]
}

// Get all users for admin purposes
export async function getAllUsers(limit: number = 100) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching all users:', error)
    throw error
  }

  return data as UserProfile[]
}
