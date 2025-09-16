const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Factory Pair Addresses...\n");

    const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

    const TOKENS = {
        SHAH: SHAH_TOKEN,
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    };

    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);

    console.log("🔍 Checking what factory returns for pairs...\n");

    const pairs = [
        { name: "SHAH/USDT", tokenA: TOKENS.SHAH, tokenB: TOKENS.USDT },
        { name: "SHAH/DAI", tokenA: TOKENS.SHAH, tokenB: TOKENS.DAI },
        { name: "SHAH/ETH", tokenA: TOKENS.SHAH, tokenB: TOKENS.WETH }
    ];

    for (const pair of pairs) {
        console.log(`   ${pair.name}:`);
        
        try {
            // Check both directions
            const pairAB = await factory.getPair(pair.tokenA, pair.tokenB);
            const pairBA = await factory.getPair(pair.tokenB, pair.tokenA);
            
            console.log(`     getPair(${pair.tokenA}, ${pair.tokenB}): ${pairAB}`);
            console.log(`     getPair(${pair.tokenB}, ${pair.tokenA}): ${pairBA}`);
            
            if (pairAB !== ethers.ZeroAddress) {
                const code = await ethers.provider.getCode(pairAB);
                console.log(`     Code at ${pairAB}: ${code.length} bytes`);
                console.log(`     Is contract: ${code !== '0x'}`);
            }
            
            if (pairBA !== ethers.ZeroAddress && pairBA !== pairAB) {
                const code = await ethers.provider.getCode(pairBA);
                console.log(`     Code at ${pairBA}: ${code.length} bytes`);
                console.log(`     Is contract: ${code !== '0x'}`);
            }
            
        } catch (error) {
            console.log(`     ❌ Error: ${error.message}`);
        }
        console.log("");
    }

    // Check all pairs length
    try {
        const allPairsLength = await factory.allPairsLength();
        console.log(`📊 Total pairs in factory: ${allPairsLength}`);
        
        if (allPairsLength > 0) {
            console.log("   Recent pairs:");
            for (let i = 0; i < Math.min(allPairsLength, 5); i++) {
                const pairAddress = await factory.allPairs(i);
                const code = await ethers.provider.getCode(pairAddress);
                console.log(`     Pair ${i}: ${pairAddress} (${code.length} bytes)`);
            }
        }
    } catch (error) {
        console.log(`❌ Error checking allPairs: ${error.message}`);
    }
}

main().catch(console.error);
