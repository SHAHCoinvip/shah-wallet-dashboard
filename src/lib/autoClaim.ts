import { createClient } from '@supabase/supabase-js'
import { priceService } from './prices'

export interface AutoClaimSettings {
  id: string
  userId: string
  enabled: boolean
  interval: 'daily' | 'weekly' | 'monthly'
  threshold: string // Minimum amount to claim
  lastClaimed: string | null
  nextClaimTime: string | null
  telegramNotifications: boolean
  createdAt: string
  updatedAt: string
}

export interface ClaimIntent {
  id: string
  userId: string
  poolId: string
  pendingRewards: string
  estimatedGas: string
  readyToClaim: boolean
  createdAt: string
  expiresAt: string
}

export interface AutoClaimStats {
  totalClaims: number
  totalRewardsClaimed: string
  totalGasUsed: string
  averageClaimSize: string
  lastClaimTime: string | null
}

export class AutoClaimService {
  private supabase: any
  private readonly CLAIM_INTENT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // User settings management
  async getUserSettings(userId: string): Promise<AutoClaimSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from('auto_claim_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Failed to get auto-claim settings:', error)
        return null
      }

      return this.transformSettings(data)
    } catch (error) {
      console.error('Error getting auto-claim settings:', error)
      return null
    }
  }

  async updateUserSettings(
    userId: string,
    settings: Partial<AutoClaimSettings>
  ): Promise<AutoClaimSettings | null> {
    try {
      const updateData = {
        ...settings,
        updated_at: new Date().toISOString()
      }

      // Calculate next claim time based on interval
      if (settings.interval) {
        updateData.next_claim_time = this.calculateNextClaimTime(settings.interval)
      }

      const { data, error } = await this.supabase
        .from('auto_claim_settings')
        .upsert({
          user_id: userId,
          ...updateData
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to update auto-claim settings:', error)
        return null
      }

      return this.transformSettings(data)
    } catch (error) {
      console.error('Error updating auto-claim settings:', error)
      return null
    }
  }

  async enableAutoClaim(
    userId: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    threshold: string = '1000000000000000000000' // 1 SHAH default
  ): Promise<AutoClaimSettings | null> {
    return this.updateUserSettings(userId, {
      enabled: true,
      interval,
      threshold,
      nextClaimTime: this.calculateNextClaimTime(interval)
    })
  }

  async disableAutoClaim(userId: string): Promise<AutoClaimSettings | null> {
    return this.updateUserSettings(userId, {
      enabled: false
    })
  }

  // Claim intent management
  async createClaimIntent(
    userId: string,
    poolId: string,
    pendingRewards: string
  ): Promise<ClaimIntent | null> {
    try {
      const expiresAt = new Date(Date.now() + this.CLAIM_INTENT_TTL).toISOString()
      
      const { data, error } = await this.supabase
        .from('claim_intents')
        .insert({
          user_id: userId,
          pool_id: poolId,
          pending_rewards: pendingRewards,
          estimated_gas: '0', // Will be calculated when user is online
          ready_to_claim: true,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create claim intent:', error)
        return null
      }

      return this.transformClaimIntent(data)
    } catch (error) {
      console.error('Error creating claim intent:', error)
      return null
    }
  }

  async getClaimIntents(userId: string): Promise<ClaimIntent[]> {
    try {
      const { data, error } = await this.supabase
        .from('claim_intents')
        .select('*')
        .eq('user_id', userId)
        .eq('ready_to_claim', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get claim intents:', error)
        return []
      }

      return data.map((intent: any) => this.transformClaimIntent(intent))
    } catch (error) {
      console.error('Error getting claim intents:', error)
      return []
    }
  }

  async markClaimIntentCompleted(intentId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('claim_intents')
        .update({
          ready_to_claim: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', intentId)

      if (error) {
        console.error('Failed to mark claim intent completed:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking claim intent completed:', error)
      return false
    }
  }

  // Cron job functions
  async processAutoClaims(): Promise<{
    processed: number
    intentsCreated: number
    errors: number
  }> {
    let processed = 0
    let intentsCreated = 0
    let errors = 0

    try {
      // Get all users with auto-claim enabled
      const { data: settings, error } = await this.supabase
        .from('auto_claim_settings')
        .select('*')
        .eq('enabled', true)
        .lte('next_claim_time', new Date().toISOString())

      if (error) {
        console.error('Failed to get auto-claim settings:', error)
        return { processed: 0, intentsCreated: 0, errors: 1 }
      }

      for (const setting of settings) {
        try {
          const result = await this.processUserAutoClaim(setting)
          if (result.success) {
            processed++
            if (result.intentCreated) intentsCreated++
          } else {
            errors++
          }
        } catch (error) {
          console.error(`Error processing auto-claim for user ${setting.user_id}:`, error)
          errors++
        }
      }

      return { processed, intentsCreated, errors }
    } catch (error) {
      console.error('Error in processAutoClaims:', error)
      return { processed: 0, intentsCreated: 0, errors: 1 }
    }
  }

  private async processUserAutoClaim(setting: any): Promise<{
    success: boolean
    intentCreated: boolean
  }> {
    try {
      // Check if user has pending rewards above threshold
      const pendingRewards = await this.getPendingRewards(setting.user_id)
      
      if (parseFloat(pendingRewards) < parseFloat(setting.threshold)) {
        // Update next claim time and return
        await this.updateUserSettings(setting.user_id, {
          nextClaimTime: this.calculateNextClaimTime(setting.interval)
        })
        return { success: true, intentCreated: false }
      }

      // Create claim intent
      const intent = await this.createClaimIntent(
        setting.user_id,
        'default', // pool ID - would be dynamic in production
        pendingRewards
      )

      if (intent) {
        // Update last claimed time and next claim time
        await this.updateUserSettings(setting.user_id, {
          lastClaimed: new Date().toISOString(),
          nextClaimTime: this.calculateNextClaimTime(setting.interval)
        })

        // Send notification if enabled
        if (setting.telegram_notifications) {
          await this.sendTelegramNotification(setting.user_id, pendingRewards)
        }

        return { success: true, intentCreated: true }
      }

      return { success: false, intentCreated: false }
    } catch (error) {
      console.error('Error processing user auto-claim:', error)
      return { success: false, intentCreated: false }
    }
  }

  // Utility methods
  private calculateNextClaimTime(interval: string): string {
    const now = new Date()
    
    switch (interval) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }
  }

  private async getPendingRewards(userId: string): Promise<string> {
    // Mock pending rewards - in production, this would query the staking contract
    return '50000000000000000000' // 50 SHAH
  }

  private async sendTelegramNotification(userId: string, rewards: string): Promise<void> {
    try {
      // Convert rewards to readable format
      const rewardsNum = parseFloat(rewards) / Math.pow(10, 18)
      const rewardsUSD = await priceService.getUSDValue('shah', rewards)
      
      const message = `🎉 Auto-claim ready! You have ${rewardsNum.toFixed(2)} SHAH ($${rewardsUSD.toFixed(2)}) ready to claim. Open your wallet to claim now!`
      
      // Send to Telegram bot (implementation would depend on your bot setup)
      console.log(`Sending Telegram notification to user ${userId}: ${message}`)
    } catch (error) {
      console.error('Failed to send Telegram notification:', error)
    }
  }

  // Statistics
  async getAutoClaimStats(userId: string): Promise<AutoClaimStats | null> {
    try {
      const { data, error } = await this.supabase
        .from('claim_intents')
        .select('*')
        .eq('user_id', userId)
        .eq('ready_to_claim', false)

      if (error) {
        console.error('Failed to get auto-claim stats:', error)
        return null
      }

      const totalClaims = data.length
      const totalRewardsClaimed = data.reduce((sum: number, intent: any) => 
        sum + parseFloat(intent.pending_rewards), 0
      ).toString()
      
      const totalGasUsed = data.reduce((sum: number, intent: any) => 
        sum + parseFloat(intent.estimated_gas || '0'), 0
      ).toString()
      
      const averageClaimSize = totalClaims > 0 
        ? (parseFloat(totalRewardsClaimed) / totalClaims).toString()
        : '0'

      const lastClaimTime = data.length > 0 
        ? data.sort((a: any, b: any) => 
            new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
          )[0].completed_at
        : null

      return {
        totalClaims,
        totalRewardsClaimed,
        totalGasUsed,
        averageClaimSize,
        lastClaimTime
      }
    } catch (error) {
      console.error('Error getting auto-claim stats:', error)
      return null
    }
  }

  // Data transformation
  private transformSettings(data: any): AutoClaimSettings {
    return {
      id: data.id,
      userId: data.user_id,
      enabled: data.enabled,
      interval: data.interval,
      threshold: data.threshold,
      lastClaimed: data.last_claimed,
      nextClaimTime: data.next_claim_time,
      telegramNotifications: data.telegram_notifications,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private transformClaimIntent(data: any): ClaimIntent {
    return {
      id: data.id,
      userId: data.user_id,
      poolId: data.pool_id,
      pendingRewards: data.pending_rewards,
      estimatedGas: data.estimated_gas,
      readyToClaim: data.ready_to_claim,
      createdAt: data.created_at,
      expiresAt: data.expires_at
    }
  }

  // Database schema helpers
  async createTables(): Promise<void> {
    // This would create the necessary tables in Supabase
    // In production, you'd use migrations
    console.log('Auto-claim tables would be created here')
  }
}

// Export singleton instance
export const autoClaimService = new AutoClaimService() 