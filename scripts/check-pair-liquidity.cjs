const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });
const hardhatEnvPath = path.join(__dirname, "..", ".env.hardhat");
if (fs.existsSync(hardhatEnvPath)) {
    require("dotenv").config({ path: hardhatEnvPath, override: true });
}

async function main() {
    console.log("🔍 Checking Pair Liquidity...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        // Existing pair addresses
        const EXISTING_PAIRS = {
            "SHAH/USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
            "SHAH/DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
            "SHAH/ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e"
        };

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);

        // Pair ABI for checking reserves
        const pairAbi = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];

        console.log("🔍 Checking liquidity in existing pairs...\n");

        for (const [pairName, pairAddress] of Object.entries(EXISTING_PAIRS)) {
            console.log(`   ${pairName} (${pairAddress}):`);
            
            try {
                const pair = await ethers.getContractAt(pairAbi, pairAddress);
                
                // Get reserves
                const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                
                // Get token addresses
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                
                // Get total supply
                const totalSupply = await pair.totalSupply();
                
                console.log(`     Token0: ${token0}`);
                console.log(`     Token1: ${token1}`);
                console.log(`     Reserve0: ${ethers.formatEther(reserve0)}`);
                console.log(`     Reserve1: ${ethers.formatEther(reserve1)}`);
                console.log(`     Total Supply: ${ethers.formatEther(totalSupply)}`);
                console.log(`     Last Update: ${new Date(blockTimestampLast * 1000).toISOString()}`);
                
                // Check if reserves meet minimum requirements
                const minLiquidity = 1000; // Oracle minimum liquidity requirement
                if (reserve0 >= minLiquidity && reserve1 >= minLiquidity) {
                    console.log(`     ✅ Liquidity sufficient for Oracle registration`);
                } else {
                    console.log(`     ❌ Insufficient liquidity for Oracle registration (min: ${minLiquidity})`);
                }
                
            } catch (error) {
                console.log(`     ❌ Error checking pair: ${error.message}`);
            }
            console.log("");
        }

        console.log("📊 Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("The Oracle requires minimum liquidity of 1000 units for each token");
        console.log("in a pair before it can be registered for TWAP price feeds.");
        console.log("If pairs have insufficient liquidity, you need to add more");
        console.log("liquidity before registering them in the Oracle.");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
