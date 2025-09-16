"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const telegraf_1 = require("telegraf");
const getSHAHPrice_1 = require("./src/utils/getSHAHPrice");
const contractUtils_1 = require("./src/utils/contractUtils");
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Store chat ID for automatic updates
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TARGET_WALLET = process.env.TARGET_WALLET;
bot.start((ctx) => {
    ctx.reply('Welcome to SHAHCoin VIP Bot! 🚀\n\nAvailable commands:\n/price - Get current SHAH price\n/swap - SHAH to ETH swap preview\n/stake - Staking preview and tier info\n/start - Show this welcome message');
});
bot.command('price', async (ctx) => {
    try {
        const price = await (0, getSHAHPrice_1.getSHAHPrice)();
        if (price > 0) {
            ctx.reply(`🪙 Current SHAH Price: $${(0, getSHAHPrice_1.formatPrice)(price)}`);
        }
        else {
            ctx.reply('⚠️ Unable to fetch SHAH price at the moment. Please try again later.');
        }
    }
    catch (error) {
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
        const swapPreview = await (0, contractUtils_1.getSwapPreview)(TARGET_WALLET);
        const message = `🪙 **SHAH Swap Preview**\n\n` +
            `You currently have: **${parseFloat(swapPreview.shahBalance).toFixed(2)} SHAH**\n` +
            `Estimated ETH on swap: **${parseFloat(swapPreview.estimatedEth).toFixed(6)} ETH** (via ShahSwap)\n` +
            `Slippage: **${swapPreview.slippage}**\n\n` +
            `[🔁 Quick Swap](https://wallet.shah.vip/swap)`;
        await ctx.reply(message, { parse_mode: 'Markdown' });
    }
    catch (error) {
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
        const stakePreview = await (0, contractUtils_1.getStakePreview)(TARGET_WALLET);
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
    }
    catch (error) {
        console.error('Error in stake command:', error);
        ctx.reply('⚠️ Failed to fetch staking preview. Please try again later.');
    }
});
// Function to send automatic price updates
async function sendPriceUpdate() {
    if (!CHAT_ID) {
        console.log('⚠️ TELEGRAM_CHAT_ID not set, skipping automatic updates');
        return;
    }
    try {
        const price = await (0, getSHAHPrice_1.getSHAHPrice)();
        if (price > 0) {
            const message = `📊 SHAH Price Update\n🪙 Current Price: $${(0, getSHAHPrice_1.formatPrice)(price)}\n⏰ ${new Date().toLocaleString()}`;
            await bot.telegram.sendMessage(CHAT_ID, message);
            console.log(`✅ Sent price update: $${(0, getSHAHPrice_1.formatPrice)(price)}`);
        }
        else {
            console.log('⚠️ Could not fetch price for automatic update');
        }
    }
    catch (error) {
        console.error('Error sending automatic price update:', error);
    }
}
// Start automatic price updates every 30 minutes
setInterval(sendPriceUpdate, 30 * 60 * 1000);
// Send initial price update after 1 minute
setTimeout(sendPriceUpdate, 60 * 1000);
bot.launch();
console.log('🤖 SHAH bot is running...');
console.log(`📱 Chat ID for updates: ${CHAT_ID || 'Not set'}`);
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
