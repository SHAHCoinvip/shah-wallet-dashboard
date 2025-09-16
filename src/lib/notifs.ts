import { createClient } from '@supabase/supabase-js'
import { oracleContract } from './ethers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types
export interface UserSubscription {
  id: string
  wallet_address: string
  email?: string
  telegram_user_id?: string
  wants_price: boolean
  wants_new_tokens: boolean
  wants_verifications: boolean
  price_threshold_pct: number
  created_at: string
  updated_at: string
}

export interface NotificationLog {
  id: string
  type: 'price' | 'new_token' | 'verified' | 'blacklisted'
  payload: any
  recipients: number
  sent_at: string
}

/**
 * Get mainnet JSON-RPC provider
 */
export function getProvider() {
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-rpc.publicnode.com"
  return rpcUrl
}

/**
 * Read SHAH price from oracle in USD
 */
export async function readOraclePriceUsd(): Promise<number> {
  try {
    const oracle = oracleContract()
    
    // Try different function names that might exist
    let priceWei: bigint
    try {
      priceWei = await oracle.getPriceInUSD()
    } catch {
      try {
        priceWei = await oracle.getShahUsdPrice()
      } catch {
        priceWei = await oracle.getLatestPrice()
      }
    }
    
    // Assume 8 decimals (like Chainlink price feeds)
    // If your oracle uses 18 decimals, change this
    const price = Number(priceWei) / 1e8
    
    return price
  } catch (error) {
    console.error('Failed to read oracle price:', error)
    return 0
  }
}

/**
 * Send Telegram message
 */
export async function sendTelegram(chatId: string, text: string, options?: {
  parse_mode?: 'Markdown' | 'HTML'
  disable_web_page_preview?: boolean
}): Promise<boolean> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      return false
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'Markdown',
      disable_web_page_preview: options?.disable_web_page_preview || true
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Telegram API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

/**
 * Send email using Resend
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log('RESEND_API_KEY not configured, skipping email')
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SHAH Wallet <alerts@shah.vip>',
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Get all user subscriptions
 */
export async function getSubs(): Promise<UserSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch subscriptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    return []
  }
}

/**
 * Save notification state
 */
export async function saveState(key: string, value: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notif_state')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) {
      console.error('Failed to save state:', error)
    }
  } catch (error) {
    console.error('Failed to save state:', error)
  }
}

/**
 * Get notification state
 */
export async function getState(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('notif_state')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      console.error('Failed to get state:', error)
      return null
    }

    return data?.value || null
  } catch (error) {
    console.error('Failed to get state:', error)
    return null
  }
}

/**
 * Log notification activity
 */
export async function logNotification(
  type: NotificationLog['type'],
  payload: any,
  recipients: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notification_log')
      .insert({
        type,
        payload,
        recipients,
        sent_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log notification:', error)
    }
  } catch (error) {
    console.error('Failed to log notification:', error)
  }
}

/**
 * Format USD price
 */
export function formatUsd(price: number): string {
  if (price >= 1) {
    return price.toFixed(4)
  } else if (price >= 0.01) {
    return price.toFixed(6)
  } else {
    return price.toFixed(8)
  }
}

/**
 * Generate random link code
 */
export function generateLinkCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Clean up expired telegram links
 */
export async function cleanupExpiredLinks(): Promise<void> {
  try {
    const { error } = await supabase
      .from('telegram_links')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Failed to cleanup expired links:', error)
    }
  } catch (error) {
    console.error('Failed to cleanup expired links:', error)
  }
}

/**
 * Get user subscription by wallet
 */
export async function getUserSubscription(walletAddress: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single()

    if (error) {
      console.error('Failed to get user subscription:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get user subscription:', error)
    return null
  }
}

/**
 * Upsert user subscription
 */
export async function upsertUserSubscription(subscription: Partial<UserSubscription>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        ...subscription,
        wallet_address: subscription.wallet_address?.toLowerCase(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to upsert subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to upsert subscription:', error)
    return false
  }
}