#!/bin/bash

# SHAH Wallet Bot Deployment Script

echo "🚀 Deploying SHAH Wallet Telegram Bot..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create one based on .env.example"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Test the build
echo "🧪 Testing build..."
npm test

# Start the bot
echo "🤖 Starting SHAH bot..."
npm start 