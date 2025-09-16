import { ethers } from 'ethers'
import { supabase, sendTelegram, sendEmail, logNotification } from './notifs'
import { getProvider } from './ethers'

export interface TokenSubscription {
  id: string
  wallet_address: string
  token_address: string
  alert_types: string[]
  min_amount_wei: string
  created_at: string
  updated_at: string
}

export interface TokenMetrics {
  token_address: string
  last_checked_block: string
  last_24h_volume_usd: number
  last_24h_transfer_count: number
  decimals?: number
  symbol?: string
  name?: string
  updated_at: string
}

// ERC20 Transfer event signature
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

/**
 * Get token decimals from contract
 */
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  try {
    const provider = getProvider()
    const contract = new ethers.Contract(tokenAddress, [
      'function decimals() view returns (uint8)'
    ], provider)
    
    const decimals = await contract.decimals()
    return Number(decimals)
  } catch (error) {
    console.error(`Failed to get decimals for ${tokenAddress}:`, error)
    return 18 // Default to 18 decimals
  }
}

/**
 * Get token symbol from contract
 */
export async function getTokenSymbol(tokenAddress: string): Promise<string> {
  try {
    const provider = getProvider()
    const contract = new ethers.Contract(tokenAddress, [
      'function symbol() view returns (string)'
    ], provider)
    
    return await contract.symbol()
  } catch (error) {
    console.error(`Failed to get symbol for ${tokenAddress}:`, error)
    return 'TOKEN'
  }
}

/**
 * Get token name from contract
 */
export async function getTokenName(tokenAddress: string): Promise<string> {
  try {
    const provider = getProvider()
    const contract = new ethers.Contract(tokenAddress, [
      'function name() view returns (string)'
    ], provider)
    
    return await contract.name()
  } catch (error) {
    console.error(`Failed to get name for ${tokenAddress}:`, error)
    return 'Unknown Token'
  }
}

/**
 * Fetch ERC20 transfer logs for a token
 */
export async function fetchTransferLogs(
  tokenAddress: string, 
  fromBlock: number, 
  toBlock: number
): Promise<ethers.Log[]> {
  try {
    const provider = getProvider()
    
    const filter = {
      address: tokenAddress,
      topics: [TRANSFER_TOPIC],
      fromBlock,
      toBlock
    }
    
    return await provider.getLogs(filter)
  } catch (error) {
    console.error(`Failed to fetch transfer logs for ${tokenAddress}:`, error)
    return []
  }
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amountWei: string, decimals: number): string {
  try {
    const amount = ethers.formatUnits(amountWei, decimals)
    const num = parseFloat(amount)
    
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    
    return num.toFixed(num < 1 ? 6 : 2)
  } catch (error) {
    console.error('Failed to format token amount:', error)
    return '0'
  }
}

/**
 * Parse transfer log to extract transfer details
 */
export function parseTransferLog(log: ethers.Log): {
  from: string
  to: string
  amount: string
} | null {
  try {
    // Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
    const from = `0x${log.topics[1].slice(26)}` // Remove padding
    const to = `0x${log.topics[2].slice(26)}` // Remove padding
    const amount = log.data // The value is in data field
    
    return { from, to, amount }
  } catch (error) {
    console.error('Failed to parse transfer log:', error)
    return null
  }
}

/**
 * Get all token subscriptions
 */
export async function getTokenSubscriptions(): Promise<TokenSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('token_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch token subscriptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch token subscriptions:', error)
    return []
  }
}

/**
 * Get token metrics
 */
export async function getTokenMetrics(tokenAddress: string): Promise<TokenMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('token_metrics')
      .select('*')
      .eq('token_address', tokenAddress.toLowerCase())
      .single()

    if (error) {
      console.error('Failed to get token metrics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Failed to get token metrics:', error)
    return null
  }
}

/**
 * Update token metrics
 */
export async function updateTokenMetrics(metrics: Partial<TokenMetrics> & { token_address: string }): Promise<void> {
  try {
    const { error } = await supabase
      .from('token_metrics')
      .upsert({
        ...metrics,
        token_address: metrics.token_address.toLowerCase(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to update token metrics:', error)
    }
  } catch (error) {
    console.error('Failed to update token metrics:', error)
  }
}

/**
 * Send large transfer alert
 */
export async function sendLargeTransferAlert(
  subscription: TokenSubscription,
  transfer: { from: string; to: string; amount: string },
  tokenInfo: { symbol: string; name: string; decimals: number },
  txHash: string
): Promise<boolean> {
  try {
    const formattedAmount = formatTokenAmount(transfer.amount, tokenInfo.decimals)
    
    const telegramMessage = `🚨 **Large ${tokenInfo.symbol} Transfer Detected**\n\n` +
      `💰 **Amount**: ${formattedAmount} ${tokenInfo.symbol}\n` +
      `📤 **From**: \`${transfer.from}\`\n` +
      `📥 **To**: \`${transfer.to}\`\n\n` +
      `[🔍 View Transaction](https://etherscan.io/tx/${txHash})\n` +
      `[📊 Token Info](https://etherscan.io/token/${subscription.token_address})`

    const emailSubject = `Large ${tokenInfo.symbol} Transfer: ${formattedAmount}`
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #f59e0b;">🚨 Large Transfer Alert</h2>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">${tokenInfo.name} (${tokenInfo.symbol})</h3>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount} ${tokenInfo.symbol}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> <code>${transfer.from}</code></p>
          <p style="margin: 5px 0;"><strong>To:</strong> <code>${transfer.to}</code></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://etherscan.io/tx/${txHash}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            View Transaction
          </a>
          <a href="https://etherscan.io/token/${subscription.token_address}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Token Info
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          Manage your alerts at <a href="https://wallet.shah.vip/settings/alerts">wallet.shah.vip</a>
        </p>
      </div>
    `

    // Get user subscription for contact info
    const { data: userSub } = await supabase
      .from('user_subscriptions')
      .select('telegram_user_id, email')
      .eq('wallet_address', subscription.wallet_address)
      .single()

    let sent = false

    if (userSub?.telegram_user_id) {
      const telegramSent = await sendTelegram(userSub.telegram_user_id, telegramMessage)
      if (telegramSent) sent = true
    }

    if (userSub?.email) {
      const emailSent = await sendEmail(userSub.email, emailSubject, emailHtml)
      if (emailSent) sent = true
    }

    return sent
  } catch (error) {
    console.error('Failed to send large transfer alert:', error)
    return false
  }
}

/**
 * Send volume spike alert
 */
export async function sendVolumeSpikeAlert(
  subscriptions: TokenSubscription[],
  tokenInfo: { symbol: string; name: string; address: string },
  metrics: { currentVolume: number; previousVolume: number; transferCount: number }
): Promise<number> {
  try {
    const percentIncrease = ((metrics.currentVolume - metrics.previousVolume) / metrics.previousVolume) * 100
    
    const telegramMessage = `📈 **${tokenInfo.symbol} Volume Spike**\n\n` +
      `🔥 **+${percentIncrease.toFixed(1)}%** volume increase!\n\n` +
      `📊 **Current 24h Volume**: $${metrics.currentVolume.toLocaleString()}\n` +
      `📈 **Previous 24h**: $${metrics.previousVolume.toLocaleString()}\n` +
      `🔄 **Transfers**: ${metrics.transferCount.toLocaleString()}\n\n` +
      `[📊 View on Etherscan](https://etherscan.io/token/${tokenInfo.address})\n` +
      `[💹 Price Charts](https://dextools.io/app/en/ether/pair-explorer/${tokenInfo.address})`

    const emailSubject = `${tokenInfo.symbol} Volume Spike: +${percentIncrease.toFixed(1)}%`
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #10b981;">📈 Volume Spike Alert</h2>
        <div style="background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">${tokenInfo.name} (${tokenInfo.symbol})</h3>
          <p style="margin: 5px 0; font-size: 18px; color: #059669;"><strong>+${percentIncrease.toFixed(1)}% Volume Increase</strong></p>
          <p style="margin: 5px 0;"><strong>Current 24h Volume:</strong> $${metrics.currentVolume.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Previous 24h Volume:</strong> $${metrics.previousVolume.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>Transfer Count:</strong> ${metrics.transferCount.toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://etherscan.io/token/${tokenInfo.address}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">
            View on Etherscan
          </a>
          <a href="https://dextools.io/app/en/ether/pair-explorer/${tokenInfo.address}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Price Charts
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          Manage your alerts at <a href="https://wallet.shah.vip/settings/alerts">wallet.shah.vip</a>
        </p>
      </div>
    `

    let totalSent = 0

    // Send to all subscribers of this token
    for (const subscription of subscriptions) {
      // Get user contact info
      const { data: userSub } = await supabase
        .from('user_subscriptions')
        .select('telegram_user_id, email')
        .eq('wallet_address', subscription.wallet_address)
        .single()

      let sent = false

      if (userSub?.telegram_user_id) {
        const telegramSent = await sendTelegram(userSub.telegram_user_id, telegramMessage)
        if (telegramSent) sent = true
      }

      if (userSub?.email) {
        const emailSent = await sendEmail(userSub.email, emailSubject, emailHtml)
        if (emailSent) sent = true
      }

      if (sent) totalSent++
    }

    return totalSent
  } catch (error) {
    console.error('Failed to send volume spike alert:', error)
    return 0
  }
}

/**
 * Add token subscription
 */
export async function addTokenSubscription(
  walletAddress: string,
  tokenAddress: string,
  alertTypes: string[],
  minAmountWei: string = '0'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('token_subscriptions')
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        token_address: tokenAddress.toLowerCase(),
        alert_types: alertTypes,
        min_amount_wei: minAmountWei,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to add token subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to add token subscription:', error)
    return false
  }
}

/**
 * Remove token subscription
 */
export async function removeTokenSubscription(
  walletAddress: string,
  tokenAddress: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('token_subscriptions')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('token_address', tokenAddress.toLowerCase())

    if (error) {
      console.error('Failed to remove token subscription:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to remove token subscription:', error)
    return false
  }
}

/**
 * Get user's token subscriptions
 */
export async function getUserTokenSubscriptions(walletAddress: string): Promise<TokenSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('token_subscriptions')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get user token subscriptions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get user token subscriptions:', error)
    return []
  }
}