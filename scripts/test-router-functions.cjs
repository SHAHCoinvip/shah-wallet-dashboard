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
    console.log("🧪 Testing ShahSwapRouterVS2 Functions...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const ROUTER_ADDRESS = "0x49CC894c82d19FdcBDedfbF98832553749e2F73E";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Router: ${ROUTER_ADDRESS}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const router = await ethers.getContractAt("ShahSwapRouterVS2", ROUTER_ADDRESS);

        console.log("🔍 Testing router configuration...\n");

        // Test router configuration
        const routerFactory = await router.factory();
        const routerWETH = await router.WETH();
        
        console.log(`   Router Factory: ${routerFactory}`);
        console.log(`   Router WETH: ${routerWETH}`);
        console.log(`   Expected Factory: ${FACTORY}`);
        console.log(`   Expected WETH: ${TOKENS.WETH}`);
        
        if (routerFactory === FACTORY && routerWETH === TOKENS.WETH) {
            console.log(`   ✅ Router configuration is correct`);
        } else {
            console.log(`   ❌ Router configuration mismatch`);
        }

        console.log("\n🔍 Testing factory functions...\n");

        // Test factory functions
        try {
            const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
            console.log(`   SHAH/USDT pair address: ${pairAddress}`);
            
            // Check if contract exists
            const code = await ethers.provider.getCode(pairAddress);
            if (code === '0x') {
                console.log(`   ❌ No contract at pair address`);
            } else {
                console.log(`   ✅ Contract exists at pair address`);
            }
            
        } catch (error) {
            console.log(`   ❌ Factory getPair failed: ${error.message}`);
        }

        console.log("\n🔍 Testing router library functions...\n");

        // Test router library functions
        try {
            // Test quote function
            const quote = await router.quote(
                ethers.parseEther("1"), // 1 SHAH
                ethers.parseEther("1000"), // 1000 reserveA
                ethers.parseUnits("3000", 6) // 3000 USDT reserveB
            );
            console.log(`   Quote test: 1 SHAH = ${ethers.formatUnits(quote, 6)} USDT`);
            
            // Test getAmountOut function
            const amountOut = await router.getAmountOut(
                ethers.parseEther("1"), // 1 SHAH in
                ethers.parseEther("1000"), // 1000 SHAH reserve
                ethers.parseUnits("3000", 6) // 3000 USDT reserve
            );
            console.log(`   Amount out test: 1 SHAH = ${ethers.formatUnits(amountOut, 6)} USDT`);
            
        } catch (error) {
            console.log(`   ❌ Router library functions failed: ${error.message}`);
        }

        console.log("\n🔍 Testing pair creation directly...\n");

        // Test creating a pair directly with factory
        try {
            console.log(`   Attempting to create SHAH/USDT pair directly...`);
            const createTx = await factory.createPair(TOKENS.SHAH, TOKENS.USDT);
            await createTx.wait();
            console.log(`   ✅ Pair created directly: ${createTx.hash}`);
            
            // Check if pair now exists
            const newPairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
            const newCode = await ethers.provider.getCode(newPairAddress);
            
            if (newCode === '0x') {
                console.log(`   ❌ Still no contract at pair address after creation`);
            } else {
                console.log(`   ✅ Contract now exists at pair address`);
                
                // Try to get pair info
                const pairAbi = [
                    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                    "function token0() external view returns (address)",
                    "function token1() external view returns (address)",
                    "function totalSupply() external view returns (uint256)"
                ];
                
                const pair = await ethers.getContractAt(pairAbi, newPairAddress);
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                const totalSupply = await pair.totalSupply();
                
                console.log(`   Token0: ${token0}`);
                console.log(`   Token1: ${token1}`);
                console.log(`   Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
                console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);
            }
            
        } catch (error) {
            if (error.message.includes("PAIR_EXISTS")) {
                console.log(`   ⏭️  Pair already exists (phantom pair)`);
            } else {
                console.log(`   ❌ Direct pair creation failed: ${error.message}`);
            }
        }

        console.log("\n💡 Analysis:");
        console.log("   The issue appears to be that the ShahSwap factory has phantom pairs");
        console.log("   - Factory returns addresses but no contracts are deployed");
        console.log("   - createPair fails with PAIR_EXISTS because factory thinks pair exists");
        console.log("   - Router can't add liquidity to non-existent contracts");
        
        console.log("\n🔧 Potential Solutions:");
        console.log("   1. Use a different factory that works properly");
        console.log("   2. Manually deploy pair contracts to the expected addresses");
        console.log("   3. Use Uniswap V2 factory instead of ShahSwap factory");
        console.log("   4. Fix the ShahSwap factory to properly create pairs");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
