import axios from 'axios'

interface TelegramContext {
  reply: (text: string, options?: any) => Promise<any>
  from?: {
    id: number
    first_name?: string
    username?: string
  }
}

export async function handleTelegramLink(ctx: TelegramContext, linkCode: string): Promise<void> {
  try {
    const userId = ctx.from?.id?.toString()
    const firstName = ctx.from?.first_name || 'User'
    
    if (!userId) {
      await ctx.reply('❌ Unable to identify your Telegram account. Please try again.')
      return
    }

    // Verify the link code with the API
    const apiUrl = process.env.WEBAPP_API_URL || 'https://wallet.shah.vip'
    const response = await axios.get(`${apiUrl}/api/telegram/link?code=${linkCode}`)
    
    if (response.data.success) {
      const walletAddress = response.data.wallet_address
      
      // Update the user subscription with Telegram user ID
      await linkTelegramToWallet(walletAddress, userId)
      
      const successMessage = `✅ **Wallet Linked Successfully!**\n\n` +
        `👤 Hello ${firstName}!\n` +
        `🔗 Linked to: \`${walletAddress}\`\n\n` +
        `🔔 **You'll now receive notifications for:**\n` +
        `• SHAH price alerts (5%+ changes)\n` +
        `• New token creations via Factory\n` +
        `• Token verification updates\n\n` +
        `⚙️ Customize your alerts in the wallet settings page.`

      await ctx.reply(successMessage, { parse_mode: 'Markdown' })
    } else {
      await ctx.reply('❌ Invalid or expired link code. Please generate a new one in the wallet app.')
    }
  } catch (error) {
    console.error('Telegram linking error:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        await ctx.reply('❌ Invalid or expired link code. Please generate a new one in the wallet app.')
      } else if (error.response?.status === 410) {
        await ctx.reply('⏰ This link has expired. Please generate a new one in the wallet app.')
      } else {
        await ctx.reply('❌ Unable to verify link. Please try again or contact support.')
      }
    } else {
      await ctx.reply('❌ An error occurred while linking your wallet. Please try again.')
    }
  }
}

async function linkTelegramToWallet(walletAddress: string, telegramUserId: string): Promise<void> {
  try {
    const apiUrl = process.env.WEBAPP_API_URL || 'https://wallet.shah.vip'
    
    await axios.post(`${apiUrl}/api/telegram/link-wallet`, {
      wallet_address: walletAddress,
      telegram_user_id: telegramUserId
    })
  } catch (error) {
    console.error('Failed to link Telegram to wallet:', error)
    throw error
  }
}