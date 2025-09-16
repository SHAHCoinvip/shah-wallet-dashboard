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
    console.log("🏭 Deploying ShahSwap Pair Contract...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
        const USDT_TOKEN = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

        // Expected pair address from factory
        const EXPECTED_PAIR_ADDRESS = "0x4c741106D435a6167d1117B1f37f1Eb584639C66";

        console.log("📋 Configuration:");
        console.log(`   ShahSwap Factory: ${FACTORY}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}`);
        console.log(`   USDT Token: ${USDT_TOKEN}`);
        console.log(`   Expected Pair Address: ${EXPECTED_PAIR_ADDRESS}\n`);

        // Check if contract already exists
        const existingCode = await ethers.provider.getCode(EXPECTED_PAIR_ADDRESS);
        if (existingCode !== '0x') {
            console.log("✅ Pair contract already exists at expected address");
            return;
        }

        console.log("🔍 Deploying pair contract to expected address...\n");

        // Get the pair contract factory
        const ShahSwapPair = await ethers.getContractFactory("ShahSwapPair");
        
        // Deploy the pair contract
        console.log("   Deploying ShahSwapPair contract...");
        const pair = await ShahSwapPair.deploy();
        await pair.waitForDeployment();
        
        const deployedAddress = await pair.getAddress();
        console.log(`   ✅ ShahSwapPair deployed to: ${deployedAddress}`);

        // Initialize the pair
        console.log("   Initializing pair with token addresses...");
        const initTx = await pair.initialize(SHAH_TOKEN, USDT_TOKEN);
        await initTx.wait();
        console.log(`   ✅ Pair initialized: ${initTx.hash}`);

        // Verify the pair is working
        console.log("\n🔍 Verifying pair contract...");
        
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
        const totalSupply = await pair.totalSupply();

        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);

        console.log("\n🎉 ShahSwap Pair Deployed Successfully!");
        console.log(`   Pair Address: ${deployedAddress}`);
        console.log(`   Expected Address: ${EXPECTED_PAIR_ADDRESS}`);
        
        if (deployedAddress.toLowerCase() === EXPECTED_PAIR_ADDRESS.toLowerCase()) {
            console.log("   ✅ Address matches factory expectation!");
        } else {
            console.log("   ⚠️  Address doesn't match factory expectation");
            console.log("   💡 You may need to update the factory or use the actual deployed address");
        }

        // Save deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            pairAddress: deployedAddress,
            expectedAddress: EXPECTED_PAIR_ADDRESS,
            token0: SHAH_TOKEN,
            token1: USDT_TOKEN,
            factory: FACTORY,
            status: "SUCCESS"
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "shahswap-pair-deployment.json"),
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\n💾 Deployment info saved to: shahswap-pair-deployment.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
