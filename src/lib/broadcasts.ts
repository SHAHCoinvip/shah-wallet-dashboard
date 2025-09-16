import { supabase, getSubs, sendTelegram, sendEmail } from './notifs'

export interface Broadcast {
  id: string
  title: string
  body: string
  sent_by: string
  sent_at?: string
  channels: string[]
  status: 'queued' | 'sending' | 'sent' | 'failed'
  recipient_count: number
  success_count: number
  failure_count: number
  created_at: string
  updated_at: string
}

// Admin wallet addresses that can send broadcasts
const ADMIN_WALLETS = [
  '0x1234567890123456789012345678901234567890', // Replace with actual admin wallets
  '0x2345678901234567890123456789012345678901',
].map(addr => addr.toLowerCase())

/**
 * Check if wallet is admin
 */
export function isAdmin(walletAddress: string): boolean {
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase())
}

/**
 * Create a new broadcast
 */
export async function createBroadcast(
  title: string,
  body: string,
  sentBy: string,
  channels: string[] = ['telegram', 'email']
): Promise<string | null> {
  try {
    if (!isAdmin(sentBy)) {
      throw new Error('Unauthorized: Only admins can create broadcasts')
    }

    const { data, error } = await supabase
      .from('broadcasts')
      .insert({
        title,
        body,
        sent_by: sentBy.toLowerCase(),
        channels,
        status: 'queued'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to create broadcast:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('Failed to create broadcast:', error)
    return null
  }
}

/**
 * Get all broadcasts
 */
export async function getBroadcasts(): Promise<Broadcast[]> {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to get broadcasts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get broadcasts:', error)
    return []
  }
}

/**
 * Get queued broadcasts ready to send
 */
export async function getQueuedBroadcasts(): Promise<Broadcast[]> {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to get queued broadcasts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get queued broadcasts:', error)
    return []
  }
}

/**
 * Update broadcast status
 */
export async function updateBroadcastStatus(
  broadcastId: string,
  status: Broadcast['status'],
  counts?: {
    recipient_count?: number
    success_count?: number
    failure_count?: number
  }
): Promise<void> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'sending') {
      updateData.sent_at = new Date().toISOString()
    }

    if (counts) {
      Object.assign(updateData, counts)
    }

    const { error } = await supabase
      .from('broadcasts')
      .update(updateData)
      .eq('id', broadcastId)

    if (error) {
      console.error('Failed to update broadcast status:', error)
    }
  } catch (error) {
    console.error('Failed to update broadcast status:', error)
  }
}

/**
 * Simple markdown to HTML converter
 */
export function markdownToHtml(markdown: string): string {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n/gim, '<br>')
}

/**
 * Send broadcast to all subscribers
 */
export async function sendBroadcast(broadcast: Broadcast): Promise<{
  success: boolean
  recipientCount: number
  successCount: number
  failureCount: number
}> {
  try {
    // Update status to sending
    await updateBroadcastStatus(broadcast.id, 'sending')

    // Get all subscribers
    const subscribers = await getSubs()
    const eligibleSubscribers = subscribers.filter(sub => 
      (broadcast.channels.includes('telegram') && sub.telegram_user_id) ||
      (broadcast.channels.includes('email') && sub.email)
    )

    console.log(`📢 Sending broadcast "${broadcast.title}" to ${eligibleSubscribers.length} subscribers`)

    let successCount = 0
    let failureCount = 0

    // Format messages
    const telegramMessage = `📢 **${broadcast.title}**\n\n${broadcast.body}\n\n_From SHAH Wallet Team_`
    
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6366f1; margin: 0;">SHAH Wallet</h1>
          <p style="color: #6b7280; margin: 5px 0;">Official Announcement</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 30px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0;">${broadcast.title}</h2>
          <div style="color: #4b5563; line-height: 1.6;">
            ${markdownToHtml(broadcast.body)}
          </div>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wallet.shah.vip" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Open SHAH Wallet
          </a>
        </div>
        
        <div style="text-align: center; margin: 30px 0; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            You're receiving this because you're subscribed to SHAH Wallet notifications.<br>
            <a href="https://wallet.shah.vip/settings/alerts" style="color: #6366f1;">Manage your notifications</a>
          </p>
        </div>
      </div>
    `

    // Send to subscribers with rate limiting (20 messages per second)
    const batchSize = 20
    const delay = 1000 // 1 second between batches

    for (let i = 0; i < eligibleSubscribers.length; i += batchSize) {
      const batch = eligibleSubscribers.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(async (subscriber) => {
          let sent = false
          
          try {
            // Send Telegram if enabled and user has Telegram
            if (broadcast.channels.includes('telegram') && subscriber.telegram_user_id) {
              const telegramSent = await sendTelegram(subscriber.telegram_user_id, telegramMessage)
              if (telegramSent) sent = true
            }
            
            // Send email if enabled and user has email
            if (broadcast.channels.includes('email') && subscriber.email) {
              const emailSent = await sendEmail(subscriber.email, broadcast.title, emailHtml)
              if (emailSent) sent = true
            }
            
            if (sent) {
              successCount++
            } else {
              failureCount++
            }
          } catch (error) {
            console.error(`Failed to send broadcast to ${subscriber.wallet_address}:`, error)
            failureCount++
          }
        })
      )
      
      // Wait before next batch (except for last batch)
      if (i + batchSize < eligibleSubscribers.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Update final status
    const finalStatus = failureCount === 0 ? 'sent' : 'failed'
    await updateBroadcastStatus(broadcast.id, finalStatus, {
      recipient_count: eligibleSubscribers.length,
      success_count: successCount,
      failure_count: failureCount
    })

    console.log(`✅ Broadcast complete: ${successCount} sent, ${failureCount} failed`)

    return {
      success: finalStatus === 'sent',
      recipientCount: eligibleSubscribers.length,
      successCount,
      failureCount
    }
  } catch (error) {
    console.error('Failed to send broadcast:', error)
    await updateBroadcastStatus(broadcast.id, 'failed')
    
    return {
      success: false,
      recipientCount: 0,
      successCount: 0,
      failureCount: 1
    }
  }
}