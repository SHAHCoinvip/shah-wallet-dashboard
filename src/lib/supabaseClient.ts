import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for better TypeScript support
export interface Wallet {
  id: string
  user_id: string
  address: string
  chain_id: number
  created_at: string
  updated_at: string
}

export interface StakingLog {
  id: string
  user_id: string
  amount: number
  token_address?: string
  action: 'stake' | 'unstake' | 'claim'
  tx_hash?: string
  created_at: string
}

export interface UserProfile {
  id: string
  wallet_address: string
  telegram_id?: string
  preferences: {
    notifications_enabled: boolean
    default_chain: number
    theme: 'light' | 'dark'
  }
  created_at: string
  updated_at: string
}
