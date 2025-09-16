# SHAH Wallet Telegram Bot

A TypeScript Node.js Telegram bot that provides automatic SHAH token price updates and commands.

## Features

- 🤖 **Telegram Bot Integration**: Built with Telegraf framework
- 💰 **Price Tracking**: Fetches real-time SHAH token prices from multiple sources
- ⏰ **Automatic Updates**: Sends price updates every 30 minutes
- 📊 **Commands**: `/price` and `/start` commands
- 🛡️ **Error Handling**: Robust error handling and logging
- 🔄 **Fallback Sources**: Multiple price APIs for reliability
- 📱 **Smart Formatting**: Intelligent price formatting based on value

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the bot-server directory with the following variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# SHAH Token Configuration
SHAH_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000

# Optional: CoinGecko ID for fallback price source
SHAH_COINGECKO_ID=shah-token-id

# Optional: Alchemy API Key for additional price sources
ALCHEMY_KEY=your_alchemy_key_here
```

### 3. Get Telegram Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the token to your `.env` file

### 4. Get Chat ID

1. Add your bot to a group or start a conversation
2. Send a message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find the `chat.id` in the response

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Quick Deployment

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## Commands

- `/start` - Welcome message and available commands
- `/price` - Get current SHAH token price

## Automatic Features

- **Price Updates**: Every 30 minutes, the bot automatically sends SHAH price updates to the configured chat
- **Initial Update**: Sends first price update 1 minute after startup
- **Error Handling**: Graceful handling of API failures and network issues
- **Multiple Sources**: Tries GeckoTerminal first, falls back to CoinGecko if needed
- **Smart Formatting**: Prices are formatted intelligently (e.g., 0.00012345 → 0.000123, 1234.56 → 1234.56)

## Architecture

```
bot-server/
├── bot.ts                 # Main bot logic
├── src/
│   └── utils/
│       └── getSHAHPrice.ts # Price fetching utility
├── dist/                  # Compiled JavaScript output
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Troubleshooting

1. **Bot not responding**: Check your `TELEGRAM_BOT_TOKEN`
2. **No automatic updates**: Verify `TELEGRAM_CHAT_ID` is set correctly
3. **Price fetch errors**: Ensure `SHAH_TOKEN_ADDRESS` is correct
4. **Build errors**: Run `npm install` and check TypeScript compilation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
