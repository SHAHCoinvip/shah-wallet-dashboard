# SHAH Wallet Telegram Mini-App

A modern, TON-style Telegram Mini-App for the SHAH Web3 App Wallet, featuring seamless Telegram integration, wallet connectivity, and DeFi functionality.

## 🚀 Features

- **Telegram WebApp Integration**: Native Telegram experience with initData validation
- **ShahConnect**: Automatic wallet-to-Telegram linking
- **Real-time Balances**: SHAH and ETH balance tracking
- **Staking Overview**: Current tier, APY, and pending rewards
- **Modern UI**: Glassmorphism design with smooth animations
- **Haptic Feedback**: Native Telegram haptic responses
- **Theme Support**: Automatic dark/light theme detection
- **Responsive Design**: Optimized for mobile Telegram clients

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Wagmi + Viem
- **Wallet**: RainbowKit
- **Animations**: Framer Motion
- **Backend**: Supabase
- **Telegram**: Telegram WebApp SDK

## 📁 Project Structure

```
miniapp/
├── app/
│   ├── api/
│   │   ├── tg/verify-init/route.ts
│   │   └── shahconnect/
│   │       ├── link-telegram/route.ts
│   │       └── status/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── Header.tsx
│   └── HeroCards.tsx
├── lib/
│   ├── telegram.ts
│   ├── supabase.ts
│   └── viem.ts
├── public/
│   └── lottie/
├── package.json
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the `miniapp/` directory:

```env
# App URLs
NEXT_PUBLIC_APP_URL=https://wallet.shah.vip
NEXT_PUBLIC_MINIAPP_URL=https://t.me/YourShahBot/YourMiniApp

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=@YourShahBot
TELEGRAM_BOT_WEBAPP_SECRET=your_webapp_secret_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Blockchain
NEXT_PUBLIC_RPC_MAINNET=your_ethereum_rpc_url
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract Addresses
NEXT_PUBLIC_SHAH=0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
NEXT_PUBLIC_SHAHSWAP=0x40677E55C83C032e595f0CE25035636DFD6bc03d
NEXT_PUBLIC_STAKING=0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00
NEXT_PUBLIC_SHAH_FACTORY=0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a
NEXT_PUBLIC_SHAH_REGISTRY=0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f
NEXT_PUBLIC_SHAH_PRICE_ORACLE=0x6AB49a6A16d77CE7DE6fc0c0af2bB14c6F80C75f
```

### 2. Install Dependencies

```bash
cd miniapp
npm install
```

### 3. Development

```bash
npm run dev
```

The Mini-App will be available at `http://localhost:3001`

### 4. Build for Production

```bash
npm run build
npm start
```

## 🔐 Security Features

- **initData Validation**: HMAC verification for all Telegram requests
- **CSRF Protection**: Secure API endpoints
- **Rate Limiting**: Built-in request throttling
- **No PII Logging**: Privacy-focused design
- **Content Security Policy**: Secure webview configuration

## 📱 Telegram Integration

### WebApp Initialization

The Mini-App automatically:
- Validates Telegram initData
- Applies theme and viewport settings
- Expands to full height
- Enables haptic feedback

### ShahConnect Flow

1. User opens Mini-App in Telegram
2. Telegram identity is validated
3. User connects wallet via RainbowKit
4. Wallet is automatically linked to Telegram account
5. Seamless experience across platforms

## 🎨 UI/UX Features

- **Glassmorphism Design**: Modern glass-like cards
- **Smooth Animations**: Framer Motion transitions
- **Haptic Feedback**: Native Telegram responses
- **Theme Adaptation**: Automatic dark/light mode
- **Responsive Layout**: Mobile-optimized design
- **Loading States**: Skeleton loaders and spinners

## 🔗 API Endpoints

### Telegram Verification
- `POST /api/tg/verify-init` - Validate initData

### ShahConnect
- `POST /api/shahconnect/link-telegram` - Link wallet to Telegram
- `GET /api/shahconnect/status` - Check linking status

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy to `mini.wallet.shah.vip` or subdomain
4. Configure custom domain if needed

### BotFather Configuration

1. Set Web App URL in BotFather
2. Add menu button "Open SHAH Wallet"
3. Test on iOS/Android Telegram clients

## 📊 Database Schema

The Mini-App uses the following Supabase tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram links
CREATE TABLE telegram_links (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tg_user_id BIGINT UNIQUE,
  tg_username TEXT,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  price_alerts BOOLEAN DEFAULT TRUE,
  staking_alerts BOOLEAN DEFAULT TRUE,
  nft_alerts BOOLEAN DEFAULT TRUE,
  price_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔄 Bot Integration

Update your Telegram bot to include Mini-App buttons:

```typescript
// Add to your bot commands
bot.command('start', (ctx) => {
  ctx.reply('Welcome to SHAH Wallet!', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Open Mini-App', web_app: { url: 'https://mini.wallet.shah.vip' } }
      ]]
    }
  })
})
```

## 🧪 Testing

### Local Testing
1. Use Telegram Web App Simulator
2. Test on Telegram Desktop
3. Verify on mobile Telegram clients

### Production Testing
1. Deploy to staging environment
2. Test with real Telegram accounts
3. Verify wallet connectivity
4. Test haptic feedback and animations

## 📈 Performance

- **Bundle Size**: Optimized for mobile networks
- **Loading Speed**: Fast initial load times
- **Memory Usage**: Efficient React rendering
- **Network Requests**: Minimal API calls

## 🔮 Future Features

- [ ] Complete Swap functionality
- [ ] Full Staking interface
- [ ] NFT marketplace
- [ ] Portfolio analytics
- [ ] Push notifications
- [ ] Offline support
- [ ] Biometric authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**SHAH Wallet Mini-App** - Bringing DeFi to Telegram! 🚀 