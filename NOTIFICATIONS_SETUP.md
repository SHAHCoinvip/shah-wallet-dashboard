# 🔔 SHAH Wallet Notifications Setup Guide

Complete setup guide for Telegram + Email notifications in the SHAH Web3 Wallet.

## 📋 Overview

The notification system provides real-time alerts for:
- **📈 Price Changes**: SHAH price movements above user-defined thresholds
- **🏭 New Tokens**: Tokens created via SHAH Factory
- **✅ Verification Updates**: Token verification status changes

## 🗄️ Database Setup

### 1. Supabase Tables

Run the SQL migration in Supabase:

```sql
-- Copy and paste from supabase/migrations/20241220_notifications.sql
```

### 2. Test Database Connection

Visit `/api/cron/price` in your browser to test the connection.

## 🤖 Telegram Bot Setup

### 1. Create Bot with BotFather

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command
3. Name your bot: "SHAH Wallet Alerts"
4. Username: `shahcoinvipbot` (or similar)
5. Copy the bot token

### 2. Configure Environment Variables

```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi
TELEGRAM_BOT_USERNAME=shahcoinvipbot
TELEGRAM_WEBAPP_URL=https://wallet.shah.vip
```

### 3. Update Bot Server

The bot server in `bot-server/` has been updated with:
- `/start <code>` linking functionality
- Enhanced welcome message
- Wallet linking support

Restart your bot server:
```bash
cd bot-server
npm install
npm run dev
```

### 4. Test Telegram Linking

1. Visit `/settings/alerts` in the wallet
2. Click "Link Telegram"
3. Use the generated deep link
4. Send `/start <code>` to your bot
5. Verify the link in your settings

## 📧 Email Setup (Optional)

### 1. Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to environment:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

### 2. Configure Domain (Production)

For production, verify your domain in Resend and update the "from" address in `src/lib/notifs.ts`.

## ⏰ Cron Jobs Setup

### Vercel Deployment

The `vercel.json` file configures automatic cron jobs:
- **Price alerts**: Every 5 minutes
- **Factory events**: Every 2 minutes  
- **Registry events**: Every 2 minutes

### Manual Testing

Test each endpoint manually:

```bash
# Test price alerts
curl https://wallet.shah.vip/api/cron/price

# Test factory events
curl https://wallet.shah.vip/api/cron/factory

# Test registry events
curl https://wallet.shah.vip/api/cron/registry
```

### VPS/Custom Hosting

If not using Vercel, set up cron jobs:

```bash
# Add to crontab
*/5 * * * * curl -X GET https://wallet.shah.vip/api/cron/price
*/2 * * * * curl -X GET https://wallet.shah.vip/api/cron/factory
*/2 * * * * curl -X GET https://wallet.shah.vip/api/cron/registry
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env.local` and fill in all values:

**Required for Notifications:**
- `TELEGRAM_BOT_TOKEN` - From BotFather
- `SUPABASE_SERVICE_ROLE` - For server-side database access
- `RPC_URL` - Ethereum RPC endpoint

**Optional:**
- `RESEND_API_KEY` - For email notifications
- `TELEGRAM_BOT_USERNAME` - For deep link generation

### Contract Addresses

The system monitors these mainnet contracts:
- **SHAH Factory**: `0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a`
- **SHAH Registry**: `0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f`
- **SHAH Oracle**: `0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f`

## 🧪 Testing

### 1. Test Price Alerts

Manually trigger a price check:
```bash
curl -X POST https://wallet.shah.vip/api/cron/price
```

### 2. Test Token Creation

Create a token via the factory and check:
```bash
curl -X POST https://wallet.shah.vip/api/cron/factory
```

### 3. Test Telegram Linking

1. Generate a link code via the settings page
2. Use `/start <code>` in Telegram
3. Verify the subscription is updated

### 4. Test Notifications

1. Set a low price threshold (1%)
2. Wait for the next price check
3. Verify alerts are received

## 📊 Monitoring

### Admin Dashboard

Visit `/admin` to view:
- System health status
- Recent notification logs
- User subscription counts
- Error monitoring

### Logs

Check application logs for:
- Cron job execution
- Notification delivery status
- Database errors
- RPC connectivity issues

### Health Checks

The system includes automated health monitoring:
- RPC connectivity
- Error rates
- Performance metrics

## 🔒 Security

### Rate Limiting

Built-in rate limiting prevents:
- API abuse
- Excessive notifications
- Database overload

### Data Protection

- User data is encrypted
- RLS policies protect database access
- No sensitive data in logs

## 🚀 Production Checklist

- [ ] Database tables created
- [ ] Telegram bot configured
- [ ] Environment variables set
- [ ] Cron jobs running
- [ ] Email provider configured
- [ ] Contract addresses verified
- [ ] Health checks passing
- [ ] User linking tested
- [ ] Notifications tested
- [ ] Error monitoring active

## 🆘 Troubleshooting

### Common Issues

**Cron jobs not running:**
- Check Vercel deployment logs
- Verify environment variables
- Test endpoints manually

**Telegram linking fails:**
- Check bot token
- Verify webhook configuration
- Test bot commands manually

**No notifications received:**
- Check user subscriptions
- Verify cron job execution
- Check notification logs

**Database errors:**
- Verify Supabase connection
- Check RLS policies
- Validate service role key

### Debug Endpoints

Use these for debugging:

```bash
# Check subscription status
GET /api/telegram/link?code=<CODE>

# Test notification sending
POST /api/cron/price

# Check system health
GET /admin (requires admin access)
```

## 📞 Support

For additional support:
- Check the admin dashboard for system status
- Review application logs for errors
- Test individual components separately
- Verify all environment variables

The notification system is now production-ready with comprehensive monitoring, error handling, and user management! 🎉