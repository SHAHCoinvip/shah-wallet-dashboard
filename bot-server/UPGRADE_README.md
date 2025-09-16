# 🤖 SHAH Telegram Bot Upgrade

## ✨ New Features Added

### 🔄 `/swap` Command
- **Functionality**: Shows SHAH to ETH swap preview
- **Features**:
  - Fetches current SHAH balance of target wallet
  - Uses ShahSwap `getAmountsOut()` to estimate ETH received
  - Shows slippage information
  - Includes "Quick Swap" button linking to dApp

**Example Response**:
```
🪙 SHAH Swap Preview

You currently have: 120.45 SHAH
Estimated ETH on swap: 0.0347 ETH (via ShahSwap)
Slippage: 1%

🔁 Quick Swap
```

### 📈 `/stake` Command
- **Functionality**: Shows staking preview and tier information
- **Features**:
  - Displays current SHAH balance
  - Shows qualifying staking tier and APY
  - Checks for SHAH GOLD NFT boost (+5% APY)
  - Shows current staked amount and rewards (if any)
  - Includes "Stake Now" button linking to dApp

**Example Response**:
```
📈 SHAH Staking Preview

Current SHAH Balance: 1,250.00 SHAH
Your Tier: Silver (15% APY)
🎁 NFT Boost: Active (+5% APY)
Effective APY: 20%

Currently Staked: 500.00 SHAH
Available Rewards: 12.50 SHAH

📈 Stake Now
```

## 🛠 Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```env
# Required for new commands
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your_alchemy_key_here
TARGET_WALLET=0x1234567890123456789012345678901234567890

# Existing variables
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 2. Contract Addresses
Update the contract addresses in `src/utils/contractUtils.ts`:

```typescript
const SHAH_TOKEN_ADDRESS = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8';
const SHAHSWAP_CONTRACT = '0x40677E55C83C032e595f0CE25035636DFD6bc03d';
const SHAH_STAKING_CONTRACT = '0xe6D1B29CCfd7b65C94d30cc22Db8Ebe88692CCC0';
const SHAH_GOLD_NFT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual NFT contract
```

### 3. Install Dependencies
```bash
npm install ethers
```

### 4. Build and Run
```bash
npm run build
npm start
```

## 🎯 Available Commands

- `/start` - Welcome message and command list
- `/price` - Current SHAH token price
- `/swap` - SHAH to ETH swap preview
- `/stake` - Staking preview and tier info

## 🔧 Technical Details

### Contract Integration
- **ShahSwap**: Uses `getAmountsOut()` for swap estimates
- **ShahStaking**: Uses `getStakeInfo()`, `getCurrentTier()`, `hasNftBoost()`
- **ERC20**: Uses `balanceOf()` for token balances
- **NFT**: Checks SHAH GOLD NFT balance for boost

### Tier System
- **Bronze**: 100-999 SHAH → 10% APY
- **Silver**: 1,000-4,999 SHAH → 15% APY  
- **Gold**: 5,000+ SHAH → 20% APY
- **NFT Boost**: +5% APY for SHAH GOLD NFT holders

### Error Handling
- Graceful fallbacks for contract failures
- User-friendly error messages
- Logging for debugging

## 🚀 Deployment

1. Update contract addresses
2. Set environment variables
3. Build the project: `npm run build`
4. Start the bot: `npm start`

The bot will automatically start sending price updates every 30 minutes and respond to the new commands! 