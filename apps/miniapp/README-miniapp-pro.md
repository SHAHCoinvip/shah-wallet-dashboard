# SHAH Telegram Mini-App PRO

Advanced Telegram Mini-App with Referrals, Merchant Invoices, and Portfolio tracking for the SHAH Web3 Wallet ecosystem.

## 🚀 Features

### Core PRO Features
- **Referral System**: Generate unique referral links, track conversions, and earn rewards
- **Merchant Invoices**: Create and manage invoices with multiple payment methods (Telegram Pay, Stripe, on-chain SHAH)
- **Portfolio Tracking**: Real-time portfolio overview with balances, staking, and LP positions
- **ShahConnect**: Seamless wallet-to-Telegram linking via initData validation

### Technical Features
- **Telegram WebApp Integration**: Full Telegram WebApp SDK integration with theme bridging
- **Multi-Payment Support**: Telegram Pay, Stripe, and on-chain SHAH payments
- **Real-time Data**: Live blockchain data via Viem/Wagmi
- **Security**: HMAC validation, RLS policies, rate limiting
- **Responsive Design**: Optimized for mobile Telegram clients

## 📁 Project Structure

```
apps/miniapp/
├── app/
│   ├── api/                    # API routes
│   │   ├── referrals/          # Referral system APIs
│   │   ├── invoices/           # Invoice management APIs
│   │   ├── portfolio/          # Portfolio data API
│   │   ├── tg/                 # Telegram validation
│   │   └── shahconnect/        # Wallet linking APIs
│   ├── referrals/              # Referrals page
│   ├── merchant/               # Merchant dashboard
│   ├── portfolio/              # Portfolio tracking
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main dashboard
├── components/                 # Reusable components
│   ├── InviteLinkCard.tsx      # Referral link display
│   ├── InvoiceQR.tsx           # QR code generation
│   ├── PortfolioTotals.tsx     # Portfolio overview
│   ├── StatusBadge.tsx         # Status indicators
│   ├── Header.tsx              # Mini-app header
│   └── HeroCards.tsx           # Balance cards
├── lib/                        # Utilities
│   ├── telegram.ts             # Telegram WebApp SDK
│   ├── supabase.ts             # Database client
│   └── viem.ts                 # Blockchain client
├── supabase-migrations.sql     # Database schema
└── README-miniapp-pro.md       # This file
```

## 🛠️ Setup

### 1. Environment Variables

Add to your `.env.local` and Vercel project:

```bash
# Core
NEXT_PUBLIC_APP_URL=https://wallet.shah.vip
NEXT_PUBLIC_MINIAPP_URL=https://mini.wallet.shah.vip
TELEGRAM_BOT_TOKEN=xxxxxxxx:yyyyyyyy
TELEGRAM_BOT_USERNAME=@YourShahBot
TELEGRAM_BOT_WEBAPP_SECRET=change_me_for_initData_verification

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE=your_supabase_service_role

# Blockchain
NEXT_PUBLIC_RPC_MAINNET=your_ethereum_rpc
NEXT_PUBLIC_SHAH=0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
NEXT_PUBLIC_SHAHSWAP=0x40677E55C83C032e595f0CE25035636DFD6bc03d
NEXT_PUBLIC_STAKING=0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00
NEXT_PUBLIC_SHAH_PRICE_ORACLE=0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f

# Payments
INVOICES_PROVIDER=telegram  # telegram | stripe | both
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
TELEGRAM_PAYMENT_TOKEN=your_telegram_payment_token
```

### 2. Database Setup

Run the SQL migrations in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase-migrations.sql
-- This creates all necessary tables, indexes, and RLS policies
```

### 3. Install Dependencies

```bash
cd apps/miniapp
npm install
```

### 4. Development

```bash
npm run dev
# Runs on http://localhost:3001
```

## 🔧 API Endpoints

### Referrals
- `POST /api/referrals/create` - Create referral link
- `POST /api/referrals/event` - Record referral events

### Invoices
- `POST /api/invoices/create` - Create merchant invoice
- `POST /api/invoices/webhook` - Handle payment webhooks

### Portfolio
- `GET /api/portfolio` - Get portfolio data

### Telegram
- `POST /api/tg/verify-init` - Validate initData
- `POST /api/shahconnect/link-telegram` - Link wallet to Telegram
- `GET /api/shahconnect/status` - Check linking status

## 🎯 Usage Guide

### For Users

1. **Access Mini-App**: Open via Telegram bot or direct link
2. **Connect Wallet**: Use RainbowKit to connect your wallet
3. **Auto-Linking**: Wallet automatically links to your Telegram account
4. **Use Features**:
   - View portfolio and balances
   - Create referral links and earn rewards
   - Pay invoices via multiple methods
   - Track staking and LP positions

### For Merchants

1. **Create Profile**: Set up merchant profile with business details
2. **Generate Invoices**: Create invoices with USD amounts
3. **Payment Options**: Choose from Telegram Pay, Stripe, or on-chain SHAH
4. **Track Payments**: Monitor invoice status and payments

### For Referrers

1. **Generate Link**: Create unique referral link
2. **Share**: Share link with friends via Telegram or other channels
3. **Track**: Monitor conversions and earnings
4. **Earn**: Receive rewards for successful referrals

## 🔒 Security Features

### Telegram Integration
- HMAC validation of initData
- Secure wallet-to-Telegram linking
- No PII logging

### Database Security
- Row Level Security (RLS) policies
- Service role for admin operations
- Input validation and sanitization

### Payment Security
- Webhook signature verification
- Rate limiting on API endpoints
- Secure payment token handling

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Set Environment Variables**: Add all required env vars
3. **Deploy**: Vercel will auto-deploy on push
4. **Configure Domain**: Set up custom domain if needed

### BotFather Configuration

1. **Set Web App URL**: Point to your deployed Mini-App
2. **Add Menu Button**: Create "Open SHAH Wallet" button
3. **Test**: Verify Mini-App opens correctly

### Webhook Setup

1. **Telegram Webhook**: Point to `/api/invoices/webhook`
2. **Stripe Webhook**: Point to `/api/invoices/webhook`
3. **Test**: Verify webhook signatures and responses

## 📊 Database Schema

### Core Tables
- `users` - Wallet addresses and user data
- `telegram_links` - Wallet-to-Telegram linking
- `referrals` - Referral codes and tracking
- `referral_events` - Referral conversion events
- `merchants` - Merchant profiles
- `invoices` - Invoice management
- `portfolio_snapshots` - Portfolio data caching

### Key Relationships
- Users can have multiple referral codes
- Merchants belong to users
- Invoices belong to merchants
- Referral events track conversions

## 🎨 UI/UX Features

### Design System
- **Glassmorphism**: Modern glass-like cards
- **Responsive**: Optimized for mobile Telegram
- **Dark/Light**: Theme-aware design
- **Animations**: Smooth transitions and micro-interactions

### Components
- **Hero Cards**: Balance and quick stats
- **Status Badges**: Payment and status indicators
- **QR Codes**: Payment and referral links
- **Charts**: Portfolio performance (coming soon)

## 🔧 Customization

### Adding New Payment Providers

1. Update `INVOICES_PROVIDER` environment variable
2. Add provider logic in `/api/invoices/create`
3. Update webhook handler in `/api/invoices/webhook`
4. Add provider-specific UI components

### Extending Referral System

1. Add new action types in database schema
2. Update referral event tracking
3. Add new reward calculations
4. Extend leaderboard functionality

### Portfolio Enhancements

1. Add new token types
2. Implement real-time price feeds
3. Add historical data tracking
4. Create advanced analytics

## 🐛 Troubleshooting

### Common Issues

1. **initData Validation Fails**
   - Check `TELEGRAM_BOT_WEBAPP_SECRET`
   - Verify bot token is correct
   - Ensure Mini-App is opened via Telegram

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check RLS policies
   - Ensure service role has proper permissions

3. **Payment Webhooks Not Working**
   - Verify webhook URLs
   - Check signature validation
   - Test with webhook testing tools

4. **Portfolio Data Not Loading**
   - Check RPC endpoint
   - Verify contract addresses
   - Ensure wallet is connected

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG=true
```

## 📈 Performance Optimization

### Caching Strategies
- Portfolio data caching with TTL
- Referral stats aggregation
- Invoice status caching

### Database Optimization
- Proper indexing on frequently queried columns
- Connection pooling
- Query optimization

### Frontend Optimization
- Code splitting for routes
- Image optimization
- Bundle size optimization

## 🔮 Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed portfolio analytics
- **Social Features**: Token sharing and ratings
- **Advanced Trading**: Limit orders and DCA
- **DeFi Integration**: Yield farming and liquidity
- **NFT Marketplace**: SHAH GOLD NFT trading
- **Governance**: DAO voting and proposals
- **Cross-chain**: Multi-chain support

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Service worker caching
- **Push Notifications**: Telegram push notifications
- **Biometric Auth**: WebAuthn integration
- **Advanced Security**: Multi-factor authentication

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and inline comments
- **Issues**: Create GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions
- **Telegram**: Join our community group

## 🎉 Acknowledgments

- Telegram WebApp SDK team
- Supabase for backend infrastructure
- Viem/Wagmi for blockchain integration
- RainbowKit for wallet connection
- Tailwind CSS for styling

---

**SHAH Telegram Mini-App PRO** - Advanced Web3 wallet experience in Telegram 