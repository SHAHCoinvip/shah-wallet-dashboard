const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("📊 Adding specific pairs to Oracle...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN}`);
    console.log(`WETH: ${WETH_ADDRESS}\n`);

    try {
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
        
        // Common token addresses
        const TOKENS = {
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            USDC: "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C",
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
        };

        // If you know the pair addresses, add them here
        const PAIRS_TO_ADD = [
            // Example: { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.WETH, name: "SHAH-ETH" }
            // Uncomment and modify these when you have the actual pair addresses:
            
            // { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.WETH, name: "SHAH-ETH" },
            // { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.USDC, name: "SHAH-USDC" },
            // { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.USDT, name: "SHAH-USDT" },
        ];

        if (PAIRS_TO_ADD.length === 0) {
            console.log("💡 No pairs configured to add.");
            console.log("\n📝 To add pairs manually:");
            console.log("1. Go to Etherscan: https://etherscan.io/address/0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52");
            console.log("2. Click 'Write Contract'");
            console.log("3. Call 'addPair' function with:");
            console.log(`   - pairAddress: [your pair address]`);
            console.log(`   - token0: ${SHAH_TOKEN}`);
            console.log(`   - token1: [other token address]`);
            
            console.log("\n🔍 To find pair addresses:");
            console.log("1. Check your factory contract: https://etherscan.io/address/0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a");
            console.log("2. Look for 'getPair' function calls");
            console.log("3. Or check recent transactions to see pair creation");
            
            return;
        }

        console.log("📋 Adding configured pairs...");
        for (const pair of PAIRS_TO_ADD) {
            try {
                console.log(`📋 Adding ${pair.name} pair...`);
                const tx = await oracle.addPair(pair.pairAddress, pair.token0, pair.token1);
                console.log(`Transaction Hash: ${tx.hash}`);
                await tx.wait();
                console.log(`✅ ${pair.name} pair added to Oracle!`);
            } catch (error) {
                console.log(`❌ Failed to add ${pair.name}: ${error.message}`);
            }
        }

        console.log("\n🎉 Pair addition complete!");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);
