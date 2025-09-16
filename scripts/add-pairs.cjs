const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("📊 Adding Trading Pairs to Oracle...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    
    // Common token addresses on mainnet
    const TOKENS = {
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        USDC: "0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
        LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        AAVE: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
    };

    const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
    
    // Add SHAH-ETH pair (if not already added)
    console.log("📋 Adding SHAH-ETH pair...");
    try {
        const shahEthPair = await getPairAddress(FACTORY_ADDRESS, process.env.NEXT_PUBLIC_SHAH, TOKENS.WETH);
        if (shahEthPair !== ethers.ZeroAddress) {
            const tx = await oracle.addPair(shahEthPair, process.env.NEXT_PUBLIC_SHAH, TOKENS.WETH);
            console.log(`✅ SHAH-ETH pair added: ${shahEthPair}`);
            console.log(`   Transaction: ${tx.hash}`);
        }
    } catch (error) {
        console.log("⚠️  SHAH-ETH pair already exists or error:", error.message);
    }

    console.log("\n🎉 Pair addition complete!");
}

async function getPairAddress(factory, token0, token1) {
    // Simple pair address calculation (you may need to adjust based on your factory)
    const factoryContract = await ethers.getContractAt("IShahSwapFactory", factory);
    return await factoryContract.getPair(token0, token1);
}

main().catch(console.error);
