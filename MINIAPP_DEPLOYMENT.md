# SHAH Telegram Mini App - Deployment Guide

## Current Setup

The Telegram Mini App is already integrated into the main project at `/miniapp/` and shares the same contract addresses and functionality as the main Web3 Wallet.

## Deployment Options

### Option 1: Deploy as Subdomain (Recommended)
Deploy the Mini App to `mini.wallet.shah.vip` as a separate Vercel project.

### Option 2: Deploy as Subdirectory
Deploy as part of the main app at `wallet.shah.vip/miniapp/`

## Environment Variables for Mini App

The Mini App uses the same environment variables as the main app, but with these specific settings:

```
# Mini App Specific
NEXT_PUBLIC_MINIAPP_URL=https://mini.wallet.shah.vip
NEXT_PUBLIC_APP_URL=https://wallet.shah.vip

# All contract addresses (same as main app)
NEXT_PUBLIC_SHAH=0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
NEXT_PUBLIC_SHAHSWAP_ROUTER=0x791c34Df045071eB9896DAfA57e3db46CBEBA11b
NEXT_PUBLIC_SHAHSWAP_FACTORY=0xcE9A12D1151E6776c2da10126997c47c85Cedd48
NEXT_PUBLIC_STAKING=0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00
NEXT_PUBLIC_FACTORY=0xACE01a21334a1A9e8EADbf5C19b8dC1DE28f3589
NEXT_PUBLIC_REGISTRY=0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f
NEXT_PUBLIC_PRICE_ORACLE=0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f

# RPC URLs
NEXT_PUBLIC_RPC_MAINNET=https://ethereum-rpc.publicnode.com
NEXT_PUBLIC_RPC_URL=https://ethereum-rpc.publicnode.com

# Telegram Integration
TELEGRAM_BOT_USERNAME=shahcoinvipbot
TELEGRAM_WEBAPP_URL=https://mini.wallet.shah.vip

# Supabase (same as main app)
NEXT_PUBLIC_SUPABASE_URL=https://yiyddfxfpgrnpfcluswj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZZJPjdgHfyqpUJy_zPANpg_b7H4p80h

# WalletConnect
WALLETCONNECT_PROJECT_ID=c3a53d6cc4381d7bde9cd287d5dc1773
```

## Vercel Deployment Steps

### For Subdomain Deployment (Recommended):

1. **Create New Vercel Project**:
   - Import from GitHub: `shah-wallet-dashboard`
   - **Root Directory**: `miniapp`
   - **Framework**: Next.js

2. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**: Add all variables above

4. **Domain**: Configure `mini.wallet.shah.vip`

### For Subdirectory Deployment:

1. **Modify main app routing** to include `/miniapp` path
2. **Deploy as part of main app** at `wallet.shah.vip/miniapp/`

## Telegram Bot Integration

The Mini App is accessible via the Telegram bot at:
- **Bot Username**: `@shahcoinvipbot`
- **Web App URL**: `https://mini.wallet.shah.vip`

## Features Available in Mini App

✅ **Dashboard**: Portfolio overview, quick stats
✅ **Wallet**: Connect MetaMask, WalletConnect
✅ **Swap**: SHAH ↔ ETH, SHAH ↔ USDT, SHAH ↔ DAI
✅ **Stake**: SHAH staking with tier system
✅ **Shahcoin**: Native blockchain info and downloads
✅ **NFT**: Collection viewing and management
✅ **Factory**: Token creation interface

## Testing Checklist

- [ ] Telegram bot opens Mini App correctly
- [ ] Wallet connection works (MetaMask, WalletConnect)
- [ ] All contract interactions function
- [ ] Swap functionality works
- [ ] Staking interface loads
- [ ] Shahcoin page displays correctly
- [ ] NFT collection loads
- [ ] Factory interface works

## Current Status

✅ **Code**: Mini App fully integrated
✅ **Contracts**: All DEX V3 addresses configured
✅ **Bot**: Telegram bot deployed and running
🔄 **Deployment**: Ready for Vercel deployment

## Next Steps

1. Deploy Mini App to Vercel (subdomain recommended)
2. Configure Telegram bot web app URL
3. Test all functionality
4. Go live with both main app and Mini App
