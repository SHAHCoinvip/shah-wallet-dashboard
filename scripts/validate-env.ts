#!/usr/bin/env tsx

/**
 * Standalone Environment Validation Script
 * Run with: npx tsx scripts/validate-env.ts
 * 
 * Works with both local development (.env.local) and Vercel deployment (injected env vars)
 */

import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load .env.local if it exists (for local development)
const localEnvPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath })
  console.log('📁 Loaded .env.local for local development')
} else {
  console.log('🌐 Using injected environment variables (Vercel/production mode)')
}

// Required environment variables for SHAH Web3 Wallet
const requiredEnvVars = [
  'NEXT_PUBLIC_ENABLE_LITE_WALLET',
  'NEXT_PUBLIC_MAX_LITE_WALLETS', 
  'NEXT_PUBLIC_MAX_EXTERNAL_WALLETS',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_MINIAPP_URL',
  'NEXT_PUBLIC_SHAH',
  'NEXT_PUBLIC_SHAHSWAP_ROUTER',
  'NEXT_PUBLIC_STAKING',
  'NEXT_PUBLIC_FACTORY',
  'NEXT_PUBLIC_REGISTRY',
  'NEXT_PUBLIC_PRICE_ORACLE',
  'NEXT_PUBLIC_SHAH_DECIMALS',
  'NEXT_PUBLIC_RPC_MAINNET',
  'NEXT_PUBLIC_RPC_POLYGON',
  'NEXT_PUBLIC_RPC_BSC',
  'NEXT_PUBLIC_RPC_ARBITRUM',
  'RPC_URL',
  'NEXT_PUBLIC_RPC_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME',
  'TELEGRAM_WEBAPP_URL',
  'TELEGRAM_CHAT_ID',
  'TARGET_WALLET',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'WALLETCONNECT_PROJECT_ID',
  'ETHERSCAN_KEY',
  'PRIVATE_KEY',
  'SEPOLIA_RPC_URL',
  'WEBAPP_API_URL',
  'NEXT_PUBLIC_ENABLE_GAS_UI',
  'NEXT_PUBLIC_GAS_ORACLE_URL',
  'NEXT_PUBLIC_USD_PRICE_FEED',
  'NEXT_PUBLIC_ENABLE_MULTI_NETWORK',
  'NEXT_PUBLIC_DEFAULT_NETWORKS',
  'NEXT_PUBLIC_NETWORK_STORAGE_KEY',
  'NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS',
  'BATCH_EXECUTOR_ADDRESS',
  'NEXT_PUBLIC_ENABLE_BATCH_TRANSACTIONS',
  'NEXT_PUBLIC_ENABLE_PORTFOLIO_ANALYTICS',
  'NEXT_PUBLIC_PORTFOLIO_REFRESH_INTERVAL',
  'NEXT_PUBLIC_ENABLE_PNL_TRACKING',
  'NEXT_PUBLIC_ENABLE_DISCOVERY',
  'NEXT_PUBLIC_CHART_PROVIDER',
  'NEXT_PUBLIC_CHART_EMBED_TOKEN',
  'NEXT_PUBLIC_DISCOVERY_REFRESH_INTERVAL',
  'PRICE_PROVIDER',
  'GECKOTERMINAL_API_KEY',
  'COINGECKO_API_KEY',
  'CRYPTOCOMPARE_API_KEY',
  'BALANCER_SUBGRAPH',
  'NEXT_PUBLIC_BALANCER_SUBGRAPH',
  'NEXT_PUBLIC_BALANCER_VAULT',
  'NEXT_PUBLIC_ENABLE_BALANCER_POOLS',
  'NEXT_PUBLIC_BALANCER_POOLS_REFRESH_INTERVAL',
  'NEXT_PUBLIC_ENABLE_ADVANCED_PORTFOLIO',
  'NEXT_PUBLIC_PORTFOLIO_HISTORY_DAYS',
  'NEXT_PUBLIC_PORTFOLIO_REFRESH_INTERVAL',
  'NEXT_PUBLIC_ENABLE_STAKING_AUTOCLAIM',
  'NEXT_PUBLIC_AUTOCLAIM_THRESHOLD',
  'NEXT_PUBLIC_SHAHSWAP_FACTORY',
  'NEXT_PUBLIC_SHAHSWAP_ORACLE',
  'AUTOCLAIM_EXECUTOR_ADDRESS',
  'TREASURY_ADDRESS',
  'NEXT_PUBLIC_SHAHSWAP_ROUTER_VS3'
]

console.log('🔍 SHAH Web3 Wallet - Environment Validation');
console.log('=============================================\n');

// Check for missing environment variables
const missingVars: string[] = []

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    missingVars.push(varName)
  }
}

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:')
  missingVars.forEach(varName => console.log(`  - ${varName}`))
  console.log('\n💡 Please set these environment variables in your deployment platform.')
  process.exit(1)
}

console.log('✅ All required environment variables are set!')
process.exit(0) 