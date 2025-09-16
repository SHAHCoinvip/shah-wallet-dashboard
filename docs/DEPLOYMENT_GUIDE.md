# SHAH Web3 Wallet - Production Deployment Guide

## 🚀 Quick Start Deployment

### 1. Environment Setup

First, create your production environment file:

```bash
# Copy the example environment file
cp env.example .env.local

# Edit with your production values
nano .env.local
```

### 2. Required Production Environment Variables

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_LITE_WALLET=true
NEXT_PUBLIC_MAX_LITE_WALLETS=3
NEXT_PUBLIC_MAX_EXTERNAL_WALLETS=2

# URLs (Update with your domains)
NEXT_PUBLIC_APP_URL=https://wallet.shah.vip
NEXT_PUBLIC_MINIAPP_URL=https://mini.wallet.shah.vip

# Contract Addresses (Ethereum Mainnet)
NEXT_PUBLIC_SHAH=0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
NEXT_PUBLIC_SHAHSWAP_ROUTER=0x40677E55C83C032e595f0CE25035636DFD6bc03d
NEXT_PUBLIC_STAKING=0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00
NEXT_PUBLIC_FACTORY=0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a
NEXT_PUBLIC_REGISTRY=0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f
NEXT_PUBLIC_PRICE_ORACLE=0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f

# Networks (RPC URLs)
NEXT_PUBLIC_RPC_MAINNET=https://ethereum-rpc.publicnode.com
NEXT_PUBLIC_RPC_POLYGON=https://polygon-rpc.publicnode.com
NEXT_PUBLIC_RPC_BSC=https://bsc-rpc.publicnode.com
NEXT_PUBLIC_RPC_ARBITRUM=https://arbitrum-rpc.publicnode.com

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Telegram Bot (Production)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=@YourShahBot
TELEGRAM_WEBAPP_SECRET=your-webapp-secret

# WalletConnect
WALLETCONNECT_PROJECT_ID=your-project-id

# API Keys
ETHERSCAN_KEY=your-etherscan-key
GECKOTERMINAL_API_KEY=your-geckoterminal-key
COINGECKO_API_KEY=your-coingecko-key
```

### 3. Vercel Deployment

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically

### 4. Domain Configuration

```bash
# Add custom domain in Vercel
vercel domains add wallet.shah.vip

# Configure DNS records
# A record: 76.76.19.19
# CNAME record: cname.vercel-dns.com
```

### 5. SSL Certificate
- Automatically handled by Vercel
- SSL certificate will be provisioned within 24 hours

## 🔧 Infrastructure Setup

### 1. Supabase Production Database

```sql
-- Create production database
-- Tables will be created automatically by the application

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallets" ON wallets
  FOR ALL USING (auth.uid() = user_id);
```

### 2. Stripe Production Setup

```bash
# 1. Create Stripe account
# 2. Switch to live mode
# 3. Get production keys
# 4. Configure webhook endpoint

# Webhook URL: https://wallet.shah.vip/api/webhooks/stripe
# Events to listen for:
# - payment_intent.succeeded
# - payment_intent.payment_failed
# - invoice.payment_succeeded
```

### 3. Telegram Bot Production

```bash
# 1. Create bot via @BotFather
# 2. Get production token
# 3. Set webhook URL
# 4. Configure commands

# Bot commands:
# /start - Welcome message
# /portfolio - View portfolio
# /swap - Swap tokens
# /stake - Staking info
# /nft - NFT collection
# /help - Help menu
```

### 4. Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/auto-claim",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/price-alerts",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/new-tokens",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

## 📊 Monitoring & Analytics

### 1. Error Tracking
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.ts
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "your-org",
    project: "shah-wallet",
  }
);
```

### 2. Performance Monitoring
```bash
# Vercel Analytics (built-in)
# Google Analytics
# Hotjar for user behavior
```

### 3. Health Checks
```bash
# Create health check endpoint
# /api/health - Basic health check
# /api/health/detailed - Detailed system status
```

## 🔒 Security Checklist

### 1. Environment Variables
- [ ] All secrets are in environment variables
- [ ] No hardcoded API keys
- [ ] Production keys are different from development
- [ ] Environment validator is working

### 2. Security Headers
- [ ] CSP headers configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] Referrer-Policy configured

### 3. Database Security
- [ ] RLS enabled on all tables
- [ ] Proper policies configured
- [ ] Connection string secured
- [ ] Backup strategy in place

### 4. API Security
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] Authentication required where needed

## 🧪 Testing Checklist

### 1. Pre-Deployment Tests
```bash
# Run all tests
npm run test

# Build test
npm run build

# Environment validation
npm run validate:env

# Lint check
npm run lint
```

### 2. Post-Deployment Tests
- [ ] Wallet connection works
- [ ] ShahSwap functionality
- [ ] Staking operations
- [ ] Portfolio loading
- [ ] Telegram bot commands
- [ ] Payment processing
- [ ] Auto-claim system

### 3. Performance Tests
- [ ] Page load times < 2s
- [ ] API response times < 500ms
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

## 📈 Production Monitoring

### 1. Key Metrics to Monitor
- **User Activity**: Daily active users, transactions
- **Performance**: Page load times, API response times
- **Errors**: Error rates, failed transactions
- **Security**: Suspicious activity, failed logins

### 2. Alerts Setup
```bash
# Set up alerts for:
# - High error rates (>5%)
# - Slow response times (>2s)
# - Failed transactions
# - Security incidents
```

### 3. Backup Strategy
- **Database**: Daily automated backups
- **Code**: Git repository with version control
- **Environment**: Environment variables documented
- **Contracts**: Contract addresses and ABIs backed up

## 🚨 Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check if .env.local exists
ls -la .env.local

# Verify variable names
# Ensure no spaces around = sign
# Check for typos in variable names
```

#### 2. Build Failures
```bash
# Clear cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify all imports
npm run lint
```

#### 3. Database Connection Issues
```bash
# Check Supabase connection
# Verify environment variables
# Test connection in Supabase dashboard
```

#### 4. Telegram Bot Not Responding
```bash
# Check bot token
# Verify webhook URL
# Test bot commands manually
# Check bot server logs
```

## 📞 Support

### Emergency Contacts
- **Technical Issues**: Check logs in Vercel dashboard
- **Security Issues**: Immediate action required
- **User Support**: Set up support system

### Documentation
- **User Guide**: Create comprehensive user documentation
- **API Documentation**: Document all API endpoints
- **Developer Guide**: For future developers

---

**Deployment Status**: Ready for Production  
**Last Updated**: December 20, 2024  
**Version**: 1.0.0 