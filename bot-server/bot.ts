import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { getSHAHPrice, formatPrice } from './src/utils/getSHAHPrice';
import { getSwapPreview, getStakePreview } from './src/utils/contractUtils';
import { handleTelegramLink } from './src/utils/telegramLink';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Store chat ID for automatic updates
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TARGET_WALLET = process.env.TARGET_WALLET;

// --- Daily price update configuration ---
// Bot will send SHAH price update once per day at 12:00 UTC (noon)

bot.start(async (ctx) => {
  // Check if this is a linking command
  const startPayload = ctx.message?.text?.split(' ')[1]
  
  if (startPayload) {
    // This is a wallet linking attempt
    await handleTelegramLink(ctx, startPayload)
    return
  }

  const welcomeMessage = `Welcome to SHAHCoin VIP Bot! 🚀\n\n` +
    `🎯 **Quick Commands:**\n` +
    `/price - Get current SHAH price\n` +
    `/quick_swap - Mini swap interface\n` +
    `/quick_stake - Mini staking interface\n` +
    `/factory_new - Token creation preview\n` +
    `/wallet - Open SHAH Web3 Wallet\n` +
    `/miniapp - Open SHAH Mini App\n\n` +
    `📊 **Detailed Commands:**\n` +
    `/swap - SHAH to ETH swap preview\n` +
    `/stake - Staking preview and tier info\n\n` +
    `🔗 **Access Full Wallet:**\n` +
    `[🌐 Open SHAH Wallet](https://wallet.shah.vip)\n` +
    `[🏭 Token Factory](https://wallet.shah.vip/factory)\n` +
    `[📈 Staking](https://wallet.shah.vip/staking)\n\n` +
    `🔔 **Notifications:**\n` +
    `Link your wallet in the app to receive price alerts and token updates!`;

  ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
});

bot.command('price', async (ctx) => {
  try {
    const price = await getSHAHPrice();
    if (price > 0) {
      ctx.reply(`🪙 Current SHAH Price: $${formatPrice(price)}`);
    } else {
      ctx.reply('⚠️ Unable to fetch SHAH price at the moment. Please try again later.');
    }
  } catch (error) {
    console.error('Error in price command:', error);
    ctx.reply('⚠️ Failed to fetch SHAH price. Please try again later.');
  }
});

bot.command('swap', async (ctx) => {
  try {
    if (!TARGET_WALLET) {
      ctx.reply('⚠️ TARGET_WALLET not configured in environment variables.');
      return;
    }

    const swapPreview = await getSwapPreview(TARGET_WALLET);
    
    const message = `🪙 **SHAH Swap Preview**\n\n` +
      `You currently have: **${parseFloat(swapPreview.shahBalance).toFixed(2)} SHAH**\n` +
      `Estimated ETH on swap: **${parseFloat(swapPreview.estimatedEth).toFixed(6)} ETH** (via ShahSwap)\n` +
      `Slippage: **${swapPreview.slippage}**\n\n` +
      `[🔁 Quick Swap](https://wallet.shah.vip/swap)`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in swap command:', error);
    ctx.reply('⚠️ Failed to fetch swap preview. Please try again later.');
  }
});

bot.command('stake', async (ctx) => {
  try {
    if (!TARGET_WALLET) {
      ctx.reply('⚠️ TARGET_WALLET not configured in environment variables.');
      return;
    }

    const stakePreview = await getStakePreview(TARGET_WALLET);
    
    let message = `📈 **SHAH Staking Preview**\n\n` +
      `Current SHAH Balance: **${parseFloat(stakePreview.shahBalance).toFixed(2)} SHAH**\n` +
      `Your Tier: **${stakePreview.currentTier}** (${stakePreview.tierAPY}% APY)\n`;

    if (stakePreview.hasNftBoost) {
      message += `🎁 NFT Boost: **Active** (+5% APY)\n`;
      message += `Effective APY: **${stakePreview.effectiveAPY}%**\n`;
    }

    if (parseFloat(stakePreview.currentStaked) > 0) {
      message += `\nCurrently Staked: **${parseFloat(stakePreview.currentStaked).toFixed(2)} SHAH**\n`;
      message += `Available Rewards: **${parseFloat(stakePreview.currentRewards).toFixed(4)} SHAH**\n`;
    }

    message += `\n[📈 Stake Now](https://wallet.shah.vip/staking)`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in stake command:', error);
    ctx.reply('⚠️ Failed to fetch staking preview. Please try again later.');
  }
});

// Enhanced quick commands with mini interfaces
bot.command('quick_swap', async (ctx) => {
  try {
    if (!TARGET_WALLET) {
      ctx.reply('⚠️ TARGET_WALLET not configured.');
      return;
    }

    const swapPreview = await getSwapPreview(TARGET_WALLET);
    
    const message = `⚡ **Quick Swap Interface**\n\n` +
      `💰 Your SHAH: **${parseFloat(swapPreview.shahBalance).toFixed(2)}**\n` +
      `💱 Rate: **1 SHAH = ${parseFloat(swapPreview.estimatedEth).toFixed(8)} ETH**\n` +
      `🎯 Slippage: **${swapPreview.slippage}**\n\n` +
      `💡 *Tap Quick Swap to open the full interface*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔄 Quick Swap', url: 'https://wallet.shah.vip/swap' },
          { text: '📊 Charts', url: 'https://wallet.shah.vip/swap' }
        ],
        [
          { text: '💰 Check Balance', callback_data: 'balance' },
          { text: '📈 Price Alert', callback_data: 'alert' }
        ]
      ]
    };

    await ctx.reply(message, { 
      parse_mode: 'Markdown', 
      reply_markup: keyboard 
    });
  } catch (error) {
    console.error('Error in quick_swap command:', error);
    ctx.reply('⚠️ Failed to load quick swap interface.');
  }
});

bot.command('quick_stake', async (ctx) => {
  try {
    if (!TARGET_WALLET) {
      ctx.reply('⚠️ TARGET_WALLET not configured.');
      return;
    }

    const stakePreview = await getStakePreview(TARGET_WALLET);
    
    let message = `⚡ **Quick Staking Interface**\n\n` +
      `💰 Available: **${parseFloat(stakePreview.shahBalance).toFixed(2)} SHAH**\n` +
      `🎯 Your Tier: **${stakePreview.currentTier}** (${stakePreview.tierAPY}% APY)\n`;
    
    if (stakePreview.hasNftBoost) {
      message += `🎁 NFT Boost: **Active** (+5% = ${stakePreview.effectiveAPY}% total)\n`;
    }
    
    if (parseFloat(stakePreview.currentStaked) > 0) {
      message += `\n📊 Currently Staked: **${parseFloat(stakePreview.currentStaked).toFixed(2)} SHAH**\n`;
      message += `🎁 Pending Rewards: **${parseFloat(stakePreview.currentRewards).toFixed(4)} SHAH**\n`;
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📥 Stake Now', url: 'https://wallet.shah.vip/staking' },
          { text: '🎁 Claim Rewards', url: 'https://wallet.shah.vip/staking' }
        ],
        [
          { text: '📊 Staking Stats', callback_data: 'stake_stats' },
          { text: '🏆 Tier Info', callback_data: 'tier_info' }
        ]
      ]
    };

    await ctx.reply(message, { 
      parse_mode: 'Markdown', 
      reply_markup: keyboard 
    });
  } catch (error) {
    console.error('Error in quick_stake command:', error);
    ctx.reply('⚠️ Failed to load quick staking interface.');
  }
});

bot.command('factory_new', async (ctx) => {
  try {
    const message = `🏭 **Token Factory Preview**\n\n` +
      `✨ Create your own ERC-20 token on Ethereum!\n\n` +
      `💰 **Pricing:**\n` +
      `• Pay with SHAH: **$39** (20% discount!)\n` +
      `• Pay with Card: **$49**\n\n` +
      `🔧 **Features Available:**\n` +
      `• Basic Token ✅\n` +
      `• Burnable 🔥\n` +
      `• Pausable ⏸️\n` +
      `• Capped Supply 📊\n` +
      `• Ownable 👑\n` +
      `• Upgradeable 🚀\n\n` +
      `🎯 *Tap "Create Token" to start building!*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🏭 Create Token', url: 'https://wallet.shah.vip/factory' },
          { text: '✅ Verify Token', url: 'https://wallet.shah.vip/factory/verify' }
        ],
        [
          { text: '📋 Recent Tokens', callback_data: 'recent_tokens' },
          { text: '💡 Learn More', url: 'https://wallet.shah.vip/factory' }
        ]
      ]
    };

    await ctx.reply(message, { 
      parse_mode: 'Markdown', 
      reply_markup: keyboard 
    });
  } catch (error) {
    console.error('Error in factory_new command:', error);
    ctx.reply('⚠️ Failed to load factory preview.');
  }
});

bot.command('wallet', async (ctx) => {
  const message = `🌐 **SHAH Web3 Wallet**\n\n` +
    `Access your complete DeFi dashboard:\n\n` +
    `🔗 **Quick Access:**\n` +
    `• Dashboard & Balances\n` +
    `• Token Swapping\n` +
    `• SHAH Staking\n` +
    `• Token Factory\n` +
    `• NFT Collection\n` +
    `• Transaction History\n\n` +
    `💡 *Connect your Web3 wallet to get started!*`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🌐 Open Wallet', url: 'https://wallet.shah.vip' }
      ],
      [
        { text: '🔄 Swap', url: 'https://wallet.shah.vip/swap' },
        { text: '📈 Stake', url: 'https://wallet.shah.vip/staking' }
      ],
      [
        { text: '🏭 Factory', url: 'https://wallet.shah.vip/factory' },
        { text: '🎨 NFTs', url: 'https://wallet.shah.vip/nft' }
      ]
    ]
  };

  await ctx.reply(message, { 
    parse_mode: 'Markdown', 
    reply_markup: keyboard 
  });
});

bot.command('miniapp', async (ctx) => {
  const message = `📱 **SHAH Telegram Mini App**\n\n` +
    `Access SHAH Wallet directly in Telegram:\n\n` +
    `🚀 **Features:**\n` +
    `• Portfolio Dashboard\n` +
    `• Token Swapping\n` +
    `• SHAH Staking\n` +
    `• Token Discovery\n` +
    `• Price Tracking\n` +
    `• SHAHCOIN Info\n\n` +
    `💡 *Tap "Open Mini App" to start using SHAH Wallet in Telegram!*`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📱 Open Mini App', web_app: { url: 'https://wallet.shah.vip/telegram' } }
      ],
      [
        { text: '🌐 Full Wallet', url: 'https://wallet.shah.vip' },
        { text: '📊 SHAHCOIN', url: 'https://wallet.shah.vip/shahcoin-wallet' }
      ]
    ]
  };

  await ctx.reply(message, { 
    parse_mode: 'Markdown', 
    reply_markup: keyboard 
  });
});

// Callback query handlers for interactive buttons
bot.on('callback_query', async (ctx) => {
  const data = (ctx.callbackQuery as any).data;
  
  try {
    switch (data) {
      case 'balance':
        if (TARGET_WALLET) {
          const swapPreview = await getSwapPreview(TARGET_WALLET);
          await ctx.answerCbQuery(`💰 Balance: ${parseFloat(swapPreview.shahBalance).toFixed(2)} SHAH`);
        } else {
          await ctx.answerCbQuery('⚠️ Wallet not configured');
        }
        break;
        
      case 'alert':
        await ctx.answerCbQuery('🔔 Price alerts coming soon!');
        break;
        
      case 'stake_stats':
        await ctx.answerCbQuery('📊 Check the staking page for detailed stats');
        break;
        
      case 'tier_info':
        await ctx.answerCbQuery('🏆 Tier 1: 100-999 SHAH (10%) | Tier 2: 1K-5K (15%) | Tier 3: 5K+ (20%)');
        break;
        
      case 'recent_tokens':
        await ctx.answerCbQuery('📋 View recent tokens in the factory page');
        break;
        
      default:
        await ctx.answerCbQuery('🤖 Feature in development');
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.answerCbQuery('⚠️ Error processing request');
  }
});

// --- Daily price update function ---
async function sendPriceUpdate() {
  if (!CHAT_ID) {
    console.log('⚠️ TELEGRAM_CHAT_ID not set, skipping daily price update');
    return;
  }

  try {
    const price = await getSHAHPrice();
    if (price > 0) {
      const message = `📊 Daily SHAH Price Update\n🪙 Current Price: $${formatPrice(price)}\n⏰ ${new Date().toUTCString()}\n\n📈 Follow @shahcoins for updates!`;
      await bot.telegram.sendMessage(CHAT_ID, message);
      console.log(`✅ Sent daily price update: $${formatPrice(price)}`);
    } else {
      console.log('⚠️ Could not fetch SHAH price for daily update');
    }
  } catch (error) {
    console.error('Error sending daily price update:', error);
  }
}

// Daily update scheduler: send once a day at 12:00 UTC (noon)
(function scheduleDailyUpdate() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(12, 0, 0, 0); // 12:00 UTC (noon)
  
  // If it's already past noon today, schedule for tomorrow
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  
  const delayMs = next.getTime() - now.getTime();
  console.log(`📅 Next daily price update scheduled for: ${next.toUTCString()}`);
  
  setTimeout(() => {
    console.log('🕐 Sending daily price update...');
    sendPriceUpdate();
    
    // Schedule the next day's update
    setInterval(() => {
      console.log('🕐 Sending daily price update...');
      sendPriceUpdate();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, delayMs);
})();

bot.launch();
console.log('🤖 SHAH bot is running...');
console.log(`📱 Chat ID for updates: ${CHAT_ID || 'Not set'}`);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
