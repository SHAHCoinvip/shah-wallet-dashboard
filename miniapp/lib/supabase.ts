import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client with service role
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export interface TelegramLink {
  id: number
  user_id: string
  tg_user_id: number
  tg_username: string | null
  linked_at: string
  last_seen: string
}

export interface User {
  id: string
  wallet_address: string
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  notifications_enabled: boolean
  price_alerts: boolean
  staking_alerts: boolean
  nft_alerts: boolean
  price_threshold: number
  created_at: string
  updated_at: string
}

export async function linkTelegramToWallet(tgUserId: number, tgUsername: string | null, walletAddress: string) {
  try {
    // First, ensure user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        { wallet_address: walletAddress.toLowerCase() },
        { onConflict: 'wallet_address' }
      )
      .select()
      .single()

    if (userError) throw userError

    // Then link Telegram
    const { data: link, error: linkError } = await supabaseAdmin
      .from('telegram_links')
      .upsert(
        {
          user_id: user.id,
          tg_user_id: tgUserId,
          tg_username: tgUsername,
          last_seen: new Date().toISOString()
        },
        { onConflict: 'tg_user_id' }
      )
      .select()
      .single()

    if (linkError) throw linkError

    return { success: true, link }
  } catch (error) {
    console.error('Error linking Telegram to wallet:', error)
    return { success: false, error }
  }
}

export async function getTelegramLink(tgUserId: number) {
  try {
    const { data, error } = await supabase
      .from('telegram_links')
      .select(`
        *,
        users (
          id,
          wallet_address
        )
      `)
      .eq('tg_user_id', tgUserId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error getting Telegram link:', error)
    return { success: false, error }
  }
}

export async function getUserSettings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return { success: true, data }
  } catch (error) {
    console.error('Error getting user settings:', error)
    return { success: false, error }
  }
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating user settings:', error)
    return { success: false, error }
  }
} 