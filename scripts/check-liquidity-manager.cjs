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
    console.log("🔍 Checking ShahSwapLiquidityManager...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const LIQUIDITY_MANAGER = "0x35c6F3133C0b2D1610e5f5eEF2c5dF77D43e6d1d";
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const ROUTER = "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        console.log("📋 Configuration:");
        console.log(`   Liquidity Manager: ${LIQUIDITY_MANAGER}`);
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Router: ${ROUTER}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Check if liquidity manager contract exists
        const code = await ethers.provider.getCode(LIQUIDITY_MANAGER);
        console.log(`🔍 Contract Code Length: ${code.length} characters`);
        console.log(`   Code exists: ${code !== '0x' ? '✅ Yes' : '❌ No'}\n`);

        if (code === '0x') {
            console.log("❌ No contract deployed at liquidity manager address");
            console.log("💡 Need to deploy ShahSwapLiquidityManager first");
            return;
        }

        // Try to get contract instance
        try {
            const liquidityManager = await ethers.getContractAt("ShahSwapLiquidityManager", LIQUIDITY_MANAGER);
            console.log("✅ Successfully connected to ShahSwapLiquidityManager");
            
            // Check contract state
            try {
                const router = await liquidityManager.router();
                const factory = await liquidityManager.factory();
                const shahToken = await liquidityManager.shahToken();
                const owner = await liquidityManager.owner();
                
                console.log(`   Router: ${router}`);
                console.log(`   Factory: ${factory}`);
                console.log(`   SHAH Token: ${shahToken}`);
                console.log(`   Owner: ${owner}`);
                console.log(`   Is Owner: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅ Yes' : '❌ No'}`);
                
            } catch (error) {
                console.log(`   ❌ Error reading contract state: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error connecting to contract: ${error.message}`);
        }

        console.log("\n🔍 Checking if we can use Router directly...\n");

        // Check if we can use the router directly
        try {
            const router = await ethers.getContractAt("ShahSwapRouterV2", ROUTER);
            console.log("✅ Successfully connected to ShahSwapRouterV2");
            
            // Check router state
            try {
                const factory = await router.factory();
                const weth = await router.WETH();
                
                console.log(`   Router Factory: ${factory}`);
                console.log(`   WETH: ${weth}`);
                
            } catch (error) {
                console.log(`   ❌ Error reading router state: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error connecting to router: ${error.message}`);
        }

        console.log("\n💡 Recommendations:");
        console.log("   1. If liquidity manager doesn't exist, we need to deploy it");
        console.log("   2. If it exists but fails, we might need to use the router directly");
        console.log("   3. We could also try using Uniswap V2 router for adding liquidity");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
