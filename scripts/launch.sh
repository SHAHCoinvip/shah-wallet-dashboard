#!/bin/bash

echo "🚀 SHAH Web3 Wallet - Production Launch"

# Check prerequisites
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Validate environment
echo "🔍 Validating environment..."
npm run validate:env

# Build project
echo "🔨 Building project..."
npm run build

# Deploy BatchExecutor if needed
echo "📋 Checking BatchExecutor deployment..."
if grep -q "BATCH_EXECUTOR_ADDRESS=0x0000000000000000000000000000000000000000" .env.local; then
    echo "⚠️ BatchExecutor not deployed. Run: npx hardhat run scripts/deployBatchExecutor.js --network mainnet"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Launch completed!" 