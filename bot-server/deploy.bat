@echo off
echo 🚀 Deploying SHAH Wallet Telegram Bot...

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found! Please create one based on the README
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the project
echo 🔨 Building project...
call npm run build

REM Test the build
echo 🧪 Testing build...
call npm test

REM Start the bot
echo 🤖 Starting SHAH bot...
call npm start

pause 