import { supabase } from './supabaseClient'
import type { Wallet, StakingLog, UserProfile } from './supabaseClient'

// Wallet management functions
export async function saveWalletAddress(userId: string, address: string, chainId: number = 1) {
  const { data, error } = await supabase
    .from('wallets')
    .insert({ 
      user_id: userId, 
      address: address.toLowerCase(), 
      chain_id: chainId 
    })
    .select()

  if (error) {
    console.error('Error saving wallet address:', error)
    throw error
  }
  
  return data?.[0] as Wallet
}

export async function getUserWallets(userId: string) {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user wallets:', error)
    throw error
  }

  return data as Wallet[]
}

export async function deleteWallet(walletId: string) {
  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', walletId)

  if (error) {
    console.error('Error deleting wallet:', error)
    throw error
  }
}

// User profile functions
export async function createUserProfile(walletAddress: string, telegramId?: string) {
  const { data, error } = await supabase
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
    console.error('Error creating user profile:', error)
    throw error
  }

  return data?.[0] as UserProfile
}

export async function getUserProfile(walletAddress: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data as UserProfile | null
}

export async function updateUserPreferences(walletAddress: string, preferences: Partial<UserProfile['preferences']>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      preferences,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress.toLowerCase())
    .select()

  if (error) {
    console.error('Error updating user preferences:', error)
    throw error
  }

  return data?.[0] as UserProfile
}

// Analytics and logging functions (frontend-safe)
export async function logUserAction(userId: string, action: string, metadata?: any) {
  const { error } = await supabase
    .from('user_actions')
    .insert({
      user_id: userId,
      action,
      metadata,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error logging user action:', error)
    // Don't throw here as this is just analytics
  }
}

// Portfolio tracking
export async function savePortfolioSnapshot(walletAddress: string, portfolioData: any) {
  const { error } = await supabase
    .from('portfolio_snapshots')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      portfolio_data: portfolioData,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving portfolio snapshot:', error)
    throw error
  }
}

export async function getPortfolioHistory(walletAddress: string, limit: number = 30) {
  const { data, error } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching portfolio history:', error)
    throw error
  }

  return data
}
