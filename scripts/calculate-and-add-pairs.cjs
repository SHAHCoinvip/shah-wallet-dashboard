const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Calculating and adding pairs to Oracle...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN}\n`);

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

        // Try to calculate pair addresses using CREATE2
        console.log("📋 Calculating pair addresses...");
        
        // SHAH-ETH pair calculation
        console.log("📋 Calculating SHAH-ETH pair...");
        const shahEthPair = await calculatePairAddress(FACTORY_ADDRESS, SHAH_TOKEN, WETH_ADDRESS);
        console.log(`SHAH-ETH pair calculated: ${shahEthPair}`);
        
        // Check if pair exists by trying to add it
        try {
            console.log("📋 Adding SHAH-ETH pair to Oracle...");
            const tx = await oracle.addPair(shahEthPair, SHAH_TOKEN, WETH_ADDRESS);
            console.log(`Transaction Hash: ${tx.hash}`);
            await tx.wait();
            console.log("✅ SHAH-ETH pair added to Oracle!");
        } catch (error) {
            console.log("⚠️  SHAH-ETH pair might not exist or already be added:", error.message);
        }

        // Try other common pairs
        const commonPairs = [
            { token1: TOKENS.USDC, name: "SHAH-USDC" },
            { token1: TOKENS.USDT, name: "SHAH-USDT" },
            { token1: TOKENS.DAI, name: "SHAH-DAI" },
            { token1: TOKENS.WBTC, name: "SHAH-WBTC" }
        ];

        console.log("\n📋 Trying other common pairs...");
        for (const pair of commonPairs) {
            try {
                const pairAddress = await calculatePairAddress(FACTORY_ADDRESS, SHAH_TOKEN, pair.token1);
                console.log(`📋 Adding ${pair.name} pair...`);
                const tx = await oracle.addPair(pairAddress, SHAH_TOKEN, pair.token1);
                console.log(`Transaction Hash: ${tx.hash}`);
                await tx.wait();
                console.log(`✅ ${pair.name} pair added to Oracle!`);
            } catch (error) {
                console.log(`⚠️  ${pair.name} pair might not exist: ${error.message}`);
            }
        }

        console.log("\n🎉 Pair addition attempts complete!");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

async function calculatePairAddress(factory, token0, token1) {
    // Sort tokens to ensure consistent pair address
    const [tokenA, tokenB] = token0 < token1 ? [token0, token1] : [token1, token0];
    
    // CREATE2 pair address calculation (Uniswap V2 style)
    const salt = ethers.keccak256(ethers.solidityPacked(['address', 'address'], [tokenA, tokenB]));
    const pairCodeHash = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"; // Uniswap V2 pair code hash
    
    const pairAddress = ethers.getCreateAddress({
        from: factory,
        salt: salt
    });
    
    return pairAddress;
}

main().catch(console.error);
