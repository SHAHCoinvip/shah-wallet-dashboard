const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("📊 Adding pairs to Oracle (simple approach)...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN}`);
    console.log(`WETH: ${WETH_ADDRESS}\n`);

    try {
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
        
        // Try to add SHAH-ETH pair with a common pair address pattern
        // This is a guess - you'll need to replace with actual pair addresses
        const possiblePairAddresses = [
            // These are example addresses - replace with actual ones from your factory
            "0x0000000000000000000000000000000000000000", // Placeholder
        ];

        console.log("📋 Trying to add SHAH-ETH pair...");
        
        // For now, let's just show you how to add pairs manually
        console.log("💡 Manual pair addition instructions:");
        console.log("\n1. Find your pair addresses by:");
        console.log("   - Checking your factory contract on Etherscan");
        console.log("   - Looking at recent transactions");
        console.log("   - Using a block explorer to find pair creation events");
        
        console.log("\n2. Once you have the pair address, add it manually:");
        console.log("   - Go to: https://etherscan.io/address/0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52");
        console.log("   - Click 'Write Contract'");
        console.log("   - Call 'addPair' function with:");
        console.log(`     - pairAddress: [your actual pair address]`);
        console.log(`     - token0: ${SHAH_TOKEN}`);
        console.log(`     - token1: [other token address]`);
        
        console.log("\n3. Or modify this script with actual pair addresses:");
        console.log("   - Replace the placeholder addresses in the script");
        console.log("   - Run the script again");
        
        console.log("\n🔍 To find pair addresses:");
        console.log("   - Factory: https://etherscan.io/address/0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a");
        console.log("   - Look for 'PairCreated' events");
        console.log("   - Check recent transactions for pair creation");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);
