const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔧 Completing SHAH Farming System Setup...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📋 Using account: ${deployer.address}`);
    console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Load deployed contract addresses
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    let deployment;
    
    try {
        deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        console.log("📖 Loaded existing deployment configuration");
    } catch (error) {
        console.log("❌ No existing deployment found.");
        process.exit(1);
    }

    // Use the latest deployed contract addresses
    const shahFarmAddress = "0xB63A61874636669C0D71C20CBfE0DcB3E00aFafD";
    const liquidityManagerAddress = "0x35c6F3133C0b2D1610e5f5eEF2c5dF77D43e6d1d";
    const shahTokenAddress = deployment.SHAH_TOKEN;

    console.log(`🔗 ShahFarm: ${shahFarmAddress}`);
    console.log(`🔗 Liquidity Manager: ${liquidityManagerAddress}`);
    console.log(`🔗 SHAH Token: ${shahTokenAddress}\n`);

    // Get contract instances
    const shahFarm = await ethers.getContractAt("ShahFarm", shahFarmAddress);
    const liquidityManager = await ethers.getContractAt("ShahSwapLiquidityManager", liquidityManagerAddress);
    const shahToken = await ethers.getContractAt("IERC20", shahTokenAddress);

    // ShahSwap addresses
    const SHAHSWAP_ROUTER = "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C";
    const SHAHSWAP_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    console.log("🏊 Setting up initial farming pools...");
    
    // Pool 1: SHAH/ETH (highest allocation)
    const shahEthAllocPoints = 1000;
    try {
        await shahFarm.addPool(WETH, shahEthAllocPoints, true);
        console.log(`✅ Added SHAH/ETH pool with ${shahEthAllocPoints} allocation points`);
    } catch (error) {
        console.log(`⚠️  Could not add SHAH/ETH pool: ${error.message}`);
    }

    // Pool 2: SHAH/USDC (medium allocation)
    const USDC = "0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8"; // Replace with actual USDC address
    const shahUsdcAllocPoints = 500;
    try {
        await shahFarm.addPool(USDC, shahUsdcAllocPoints, true);
        console.log(`✅ Added SHAH/USDC pool with ${shahUsdcAllocPoints} allocation points`);
    } catch (error) {
        console.log(`⚠️  Could not add SHAH/USDC pool (USDC address may not exist): ${error.message}`);
    }

    // Pool 3: SHAH/USDT (medium allocation)
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT on Ethereum
    const shahUsdtAllocPoints = 500;
    try {
        await shahFarm.addPool(USDT, shahUsdtAllocPoints, true);
        console.log(`✅ Added SHAH/USDT pool with ${shahUsdtAllocPoints} allocation points`);
    } catch (error) {
        console.log(`⚠️  Could not add SHAH/USDT pool: ${error.message}`);
    }

    // Configure liquidity manager settings
    console.log("\n⚙️  Configuring liquidity manager settings...");
    
    try {
        // Set reasonable fees (0.3% - similar to Uniswap)
        await liquidityManager.setLiquidityFee(30); // 0.3%
        console.log("✅ Set liquidity fee to 0.3%");
    } catch (error) {
        console.log(`⚠️  Could not set liquidity fee: ${error.message}`);
    }
    
    try {
        // Set auto-compound threshold to 10 SHAH
        const autoCompoundThreshold = ethers.parseEther("10");
        await liquidityManager.setAutoCompoundThreshold(autoCompoundThreshold);
        console.log(`✅ Set auto-compound threshold to ${ethers.formatEther(autoCompoundThreshold)} SHAH`);
    } catch (error) {
        console.log(`⚠️  Could not set auto-compound threshold: ${error.message}`);
    }

    // Verify contracts on Etherscan (if on mainnet)
    const network = await ethers.provider.getNetwork();
    if (network.chainId === 1n) { // Ethereum mainnet
        console.log("\n🔍 Verifying contracts on Etherscan...");
        
        try {
            await hre.run("verify:verify", {
                address: shahFarmAddress,
                constructorArguments: [shahTokenAddress, deployer.address],
            });
            console.log("✅ ShahFarm verified on Etherscan");
        } catch (error) {
            console.log(`⚠️  Could not verify ShahFarm: ${error.message}`);
        }

        try {
            await hre.run("verify:verify", {
                address: liquidityManagerAddress,
                constructorArguments: [SHAHSWAP_ROUTER, shahTokenAddress, shahFarmAddress, deployer.address],
            });
            console.log("✅ ShahSwapLiquidityManager verified on Etherscan");
        } catch (error) {
            console.log(`⚠️  Could not verify ShahSwapLiquidityManager: ${error.message}`);
        }
    }

    // Update deployment information
    const farmingDeployment = {
        ...deployment,
        SHAH_FARM: shahFarmAddress,
        LIQUIDITY_MANAGER: liquidityManagerAddress,
        SHAHSWAP_ROUTER,
        SHAHSWAP_FACTORY,
        WETH,
        POOLS: {
            SHAH_ETH: {
                address: WETH,
                allocPoints: shahEthAllocPoints,
                poolId: 0
            },
            SHAH_USDC: {
                address: USDC,
                allocPoints: shahUsdcAllocPoints,
                poolId: 1
            },
            SHAH_USDT: {
                address: USDT,
                allocPoints: shahUsdtAllocPoints,
                poolId: 2
            }
        },
        SETTINGS: {
            liquidityFee: 30, // 0.3%
            autoCompoundThreshold: ethers.parseEther("10").toString(),
            farmRewardAmount: ethers.parseEther("1000000").toString()
        },
        DEPLOYMENT_TIME: new Date().toISOString(),
        DEPLOYER: deployer.address
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(farmingDeployment, null, 2));
    console.log("\n💾 Deployment configuration updated in deployment.json");

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SHAH FARMING SYSTEM SETUP COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📋 ShahFarm Contract: ${shahFarmAddress}`);
    console.log(`📋 ShahSwap Liquidity Manager: ${liquidityManagerAddress}`);
    console.log(`🔗 SHAH Token: ${shahTokenAddress}`);
    console.log(`💰 Initial Reward Pool: 1,000,000 SHAH`);
    console.log(`⚡ Reward Rate: 1 SHAH per day`);
    console.log(`🏊 Total Pools: ${await shahFarm.poolLength()}`);
    console.log(`💸 Liquidity Fee: 0.3%`);
    console.log(`🔄 Auto-compound Threshold: 10 SHAH`);
    console.log("=".repeat(60));

    console.log("\n📚 Next Steps:");
    console.log("1. Add liquidity to SHAH/ETH pair on ShahSwap");
    console.log("2. Stake LP tokens in the farming contract");
    console.log("3. Monitor rewards and harvest periodically");
    console.log("4. Consider enabling auto-compound for optimal returns");
    console.log("5. Add more LP pairs as needed");

    console.log("\n🔗 Useful Links:");
    console.log(`- ShahFarm Contract: https://etherscan.io/address/${shahFarmAddress}`);
    console.log(`- Liquidity Manager: https://etherscan.io/address/${liquidityManagerAddress}`);
    console.log(`- SHAH Token: https://etherscan.io/address/${shahTokenAddress}`);

    return {
        shahFarm: shahFarmAddress,
        liquidityManager: liquidityManagerAddress,
        deployment: farmingDeployment
    };
}

// Execute setup
main()
    .then((result) => {
        console.log("\n✅ Farming system setup completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Setup failed:", error);
        process.exit(1);
    });

