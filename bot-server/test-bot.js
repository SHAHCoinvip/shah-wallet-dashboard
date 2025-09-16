// Simple test script to verify bot functionality
require('dotenv/config');

async function testBot() {
  try {
    console.log('🧪 Testing SHAH Bot...');
    
    // Test price fetching
    const { getSHAHPrice } = require('./dist/src/utils/getSHAHPrice');
    const price = await getSHAHPrice();
    console.log(`💰 SHAH Price: $${price}`);
    
    // Test environment variables
    console.log(`🤖 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`📱 Chat ID: ${process.env.TELEGRAM_CHAT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`🪙 Token Address: ${process.env.SHAH_TOKEN_ADDRESS ? '✅ Set' : '❌ Missing'}`);
    
    console.log('✅ Bot test completed successfully!');
  } catch (error) {
    console.error('❌ Bot test failed:', error.message);
  }
}

testBot(); 