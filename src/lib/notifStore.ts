import { supabase } from './notifs'

export interface NotificationEvent {
  id: string
  wallet_address: string
  type: 'price_change' | 'token_created' | 'token_verified' | 'token_blacklisted' | 'custom_token_alert' | 'broadcast'
  payload: any
  created_at: string
  read: boolean
  read_at?: string
}

/**
 * Add notification event for a user
 */
export async function addNotificationEvent(
  walletAddress: string,
  type: NotificationEvent['type'],
  payload: any
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notif_events')
      .insert({
        wallet_address: walletAddress.toLowerCase(),
        type,
        payload,
        read: false
      })

    if (error) {
      console.error('Failed to add notification event:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to add notification event:', error)
    return false
  }
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  walletAddress: string,
  limit: number = 100,
  offset: number = 0
): Promise<NotificationEvent[]> {
  try {
    const { data, error } = await supabase
      .from('notif_events')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to get notifications:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get notifications:', error)
    return []
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(walletAddress: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notif_events')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('read', false)

    if (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Failed to get unread count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notif_events')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(walletAddress: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notif_events')
      .update({ read: true })
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('read', false)

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return false
  }
}

/**
 * Format notification for display
 */
export function formatNotification(notification: NotificationEvent): {
  icon: string
  title: string
  description: string
  link?: string
  color: string
} {
  const { type, payload } = notification

  switch (type) {
    case 'price_change':
      const priceChange = payload.percentChange > 0 ? 'increased' : 'decreased'
      const emoji = payload.percentChange > 0 ? '📈' : '📉'
      return {
        icon: emoji,
        title: `SHAH Price ${priceChange}`,
        description: `${payload.percentChange > 0 ? '+' : ''}${payload.percentChange.toFixed(2)}% change to $${payload.currentPrice.toFixed(6)}`,
        link: '/swap',
        color: payload.percentChange > 0 ? 'text-green-400' : 'text-red-400'
      }

    case 'token_created':
      return {
        icon: '✅',
        title: 'New Token Created',
        description: `${payload.name} (${payload.symbol}) created via SHAH Factory`,
        link: `https://etherscan.io/token/${payload.token}`,
        color: 'text-blue-400'
      }

    case 'token_verified':
      return {
        icon: '🔒',
        title: 'Token Verified',
        description: `Token ${payload.token.slice(0, 6)}...${payload.token.slice(-4)} has been verified`,
        link: `https://etherscan.io/token/${payload.token}`,
        color: 'text-green-400'
      }

    case 'token_blacklisted':
      return {
        icon: '⛔',
        title: 'Token Blacklisted',
        description: `Token ${payload.token.slice(0, 6)}...${payload.token.slice(-4)} has been blacklisted`,
        link: `https://etherscan.io/token/${payload.token}`,
        color: 'text-red-400'
      }

    case 'custom_token_alert':
      if (payload.type === 'large_transfer') {
        return {
          icon: '🚨',
          title: 'Large Transfer Alert',
          description: `${payload.symbol}: ${payload.amount} transfer detected`,
          link: `https://etherscan.io/tx/${payload.txHash}`,
          color: 'text-yellow-400'
        }
      } else if (payload.type === 'volume_spike') {
        return {
          icon: '📈',
          title: 'Volume Spike Alert',
          description: `${payload.symbol}: +${payload.percentIncrease.toFixed(1)}% volume increase`,
          link: `https://etherscan.io/token/${payload.token}`,
          color: 'text-purple-400'
        }
      }
      break

    case 'broadcast':
      return {
        icon: '📢',
        title: payload.title || 'Announcement',
        description: payload.body?.slice(0, 100) + (payload.body?.length > 100 ? '...' : ''),
        color: 'text-blue-400'
      }

    default:
      return {
        icon: '📋',
        title: 'Notification',
        description: 'You have a new notification',
        color: 'text-gray-400'
      }
  }

  return {
    icon: '📋',
    title: 'Notification',
    description: 'You have a new notification',
    color: 'text-gray-400'
  }
}

/**
 * Get relative time string
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}