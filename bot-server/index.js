// 🌱 Load environment variables
require('dotenv').config()

// 📦 Import packages
const axios = require('axios')
const { ethers } = require('ethers')
const { OpenAI } = require('openai')
const TelegramBot = require('node-telegram-bot-api')
const fs = require('fs')

// 🔐 Setup from .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const walletAddress = process.env.TARGET_WALLET
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
const chatId = process.env.TELEGRAM_CHAT_ID

// 🧪 Simulated Token Fetch
async function fetchTokenData() {
  // Replace this later with live wallet reading
  return [
    { symbol: 'SHAH', balance: 120 },
    { symbol: 'ETH', balance: 0.8 },
    { symbol: 'USDT', balance: 60 }
  ]
}

// 🧠 Get AI Strategy
async function getTradeStrategy(tokens) {
  const prompt = `These are my wallet tokens: ${tokens.map(t => `${t.symbol} (${t.balance})`).join(', ')}. Suggest a smart crypto trade strategy I can apply right now.`
  const chat = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })
  return chat.choices[0].message.content.trim()
}

// 🔁 Bot Runner
async function execute() {
  const timestamp = new Date().toLocaleString()
  console.log(`\n🚀 Bot tick @ ${timestamp}`)

  const tokens = await fetchTokenData()
  const strategy = await getTradeStrategy(tokens)

  const logMsg = `📈 [${timestamp}]\n🤖 Trade Suggestion:\n${strategy}`
  fs.appendFileSync('trade-log.txt', logMsg + '\n\n')

  // 📬 Send to Telegram
  try {
    await bot.sendMessage(chatId, logMsg)
    console.log('✅ Sent Telegram alert')
  } catch (err) {
    console.error('❌ Failed to send Telegram alert:', err)
  }
}

// 🕒 Every 30 minutes
setInterval(execute, 30 * 60 * 1000)
execute()
