const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Finding and adding pairs to Oracle...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN}\n`);

    try {
        // Try to get the factory contract
        const factory = await ethers.getContractAt("IShahSwapFactory", FACTORY_ADDRESS);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
        
        // Try to find SHAH-ETH pair
        console.log("📋 Looking for SHAH-ETH pair...");
        try {
            const shahEthPair = await factory.getPair(SHAH_TOKEN, WETH_ADDRESS);
            console.log(`SHAH-ETH pair found: ${shahEthPair}`);
            
            if (shahEthPair !== ethers.ZeroAddress) {
                console.log("📋 Adding SHAH-ETH pair to Oracle...");
                const tx = await oracle.addPair(shahEthPair, SHAH_TOKEN, WETH_ADDRESS);
                console.log(`Transaction Hash: ${tx.hash}`);
                await tx.wait();
                console.log("✅ SHAH-ETH pair added to Oracle!");
            } else {
                console.log("⚠️  SHAH-ETH pair doesn't exist yet");
            }
        } catch (error) {
            console.log("⚠️  Could not find SHAH-ETH pair:", error.message);
        }

        // Try to find other common pairs
        const commonTokens = [
            { symbol: "USDC", address: "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C" },
            { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
            { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
            { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" }
        ];

        console.log("\n📋 Checking for other pairs...");
        for (const token of commonTokens) {
            try {
                const pair = await factory.getPair(SHAH_TOKEN, token.address);
                if (pair !== ethers.ZeroAddress) {
                    console.log(`Found SHAH-${token.symbol} pair: ${pair}`);
                    
                    // Add to Oracle
                    const tx = await oracle.addPair(pair, SHAH_TOKEN, token.address);
                    console.log(`✅ SHAH-${token.symbol} pair added to Oracle!`);
                    console.log(`   Transaction: ${tx.hash}`);
                }
            } catch (error) {
                // Skip if pair doesn't exist
            }
        }

        console.log("\n🎉 Pair addition complete!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.log("\n💡 Manual approach:");
        console.log("1. Go to Etherscan: https://etherscan.io/address/0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52");
        console.log("2. Click 'Write Contract'");
        console.log("3. Call 'addPair' function with:");
        console.log(`   - pairAddress: [your pair address]`);
        console.log(`   - token0: ${SHAH_TOKEN}`);
        console.log(`   - token1: [other token address]`);
    }
}

main().catch(console.error);
