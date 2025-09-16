const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying SHAH Farming System...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`📋 Deploying contracts with account: ${deployer.address}`);
    console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

    // Load deployed contract addresses
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    let deployment;
    
    try {
        deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        console.log("📖 Loaded existing deployment configuration");
    } catch (error) {
        console.log("❌ No existing deployment found. Please deploy SHAH token first.");
        process.exit(1);
    }

    const shahTokenAddress = deployment.SHAH_TOKEN;
    if (!shahTokenAddress) {
        console.log("❌ SHAH token not found in deployment. Please deploy SHAH token first.");
        process.exit(1);
    }

    console.log(`🔗 SHAH Token Address: ${shahTokenAddress}`);

    // ShahSwap addresses (from your deployment)
    const SHAHSWAP_ROUTER = "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C";
    const SHAHSWAP_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    console.log(`🔗 ShahSwap Router: ${SHAHSWAP_ROUTER}`);
    console.log(`🔗 ShahSwap Factory: ${SHAHSWAP_FACTORY}`);
    console.log(`🔗 WETH: ${WETH}\n`);

    // Deploy ShahFarm contract
    console.log("🏗️  Deploying ShahFarm contract...");
    const ShahFarm = await ethers.getContractFactory("ShahFarm");
    const shahFarm = await ShahFarm.deploy(shahTokenAddress, deployer.address);
    await shahFarm.waitForDeployment();
    
    const shahFarmAddress = await shahFarm.getAddress();
    console.log(`✅ ShahFarm deployed to: ${shahFarmAddress}`);

    // Deploy ShahSwapLiquidityManager contract
    console.log("\n🏗️  Deploying ShahSwapLiquidityManager contract...");
    const ShahSwapLiquidityManager = await ethers.getContractFactory("ShahSwapLiquidityManager");
    const liquidityManager = await ShahSwapLiquidityManager.deploy(
        SHAHSWAP_ROUTER,
        shahTokenAddress,
        shahFarmAddress,
        deployer.address
    );
    await liquidityManager.waitForDeployment();
    
    const liquidityManagerAddress = await liquidityManager.getAddress();
    console.log(`✅ ShahLiquidityManager deployed to: ${liquidityManagerAddress}`);

    // Get SHAH token contract
    const shahToken = await ethers.getContractAt("IERC20", shahTokenAddress);

    // Transfer ownership of farm to liquidity manager (optional)
    console.log("\n🔧 Configuring contract permissions...");
    
    // Set liquidity manager as farm owner (optional - for auto-compound functionality)
    // await shahFarm.transferOwnership(liquidityManagerAddress);
    // console.log("✅ Transferred farm ownership to liquidity manager");

    // Fund the farm with SHAH tokens for rewards
    console.log("\n💰 Funding farm with SHAH rewards...");
    
    const farmRewardAmount = ethers.parseEther("1000000"); // 1M SHAH for rewards
    const deployerBalance = await shahToken.balanceOf(deployer.address);
    
    if (deployerBalance >= farmRewardAmount) {
        await shahToken.transfer(shahFarmAddress, farmRewardAmount);
        console.log(`✅ Transferred ${ethers.formatEther(farmRewardAmount)} SHAH to farm for rewards`);
    } else {
        console.log(`⚠️  Insufficient SHAH balance. Need ${ethers.formatEther(farmRewardAmount)}, have ${ethers.formatEther(deployerBalance)}`);
        console.log("💡 Please transfer SHAH tokens to the farm manually for rewards");
    }

    // Set initial reward rate (1 SHAH per day = 1e18 / 86400 per second)
    const rewardRatePerSecond = ethers.parseEther("1") / 86400n; // 1 SHAH per day
    await shahFarm.setRewardRate(rewardRatePerSecond);
    console.log(`✅ Set reward rate to ${ethers.formatEther(rewardRatePerSecond)} SHAH per second`);

    // Add initial farming pools
    console.log("\n🏊 Setting up initial farming pools...");
    
    // Pool 1: SHAH/ETH (highest allocation)
    const shahEthAllocPoints = 1000;
    await shahFarm.addPool(WETH, shahEthAllocPoints, true);
    console.log(`✅ Added SHAH/ETH pool with ${shahEthAllocPoints} allocation points`);

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
    
    // Set reasonable fees (0.3% - similar to Uniswap)
    await liquidityManager.setLiquidityFee(30); // 0.3%
    console.log("✅ Set liquidity fee to 0.3%");
    
    // Set auto-compound threshold to 10 SHAH
    const autoCompoundThreshold = ethers.parseEther("10");
    await liquidityManager.setAutoCompoundThreshold(autoCompoundThreshold);
    console.log(`✅ Set auto-compound threshold to ${ethers.formatEther(autoCompoundThreshold)} SHAH`);

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

    // Save deployment information
    const farmingDeployment = {
        ...deployment,
        SHAH_FARM: shahFarmAddress,
        LIQUIDITY_MANAGER: liquidityManagerAddress,
        SHAHSWAP_ROUTER,
        SHAHSWAP_FACTORY,
        WETH,
        FARM_REWARD_RATE: rewardRatePerSecond.toString(),
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
            autoCompoundThreshold: autoCompoundThreshold.toString(),
            farmRewardAmount: farmRewardAmount.toString()
        },
        DEPLOYMENT_TIME: new Date().toISOString(),
        DEPLOYER: deployer.address
    };

    fs.writeFileSync(deploymentPath, JSON.stringify(farmingDeployment, null, 2));
    console.log("\n💾 Deployment configuration saved to deployment.json");

    // Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SHAH FARMING SYSTEM DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log(`📋 ShahFarm Contract: ${shahFarmAddress}`);
    console.log(`📋 ShahSwap Liquidity Manager: ${liquidityManagerAddress}`);
    console.log(`🔗 SHAH Token: ${shahTokenAddress}`);
    console.log(`💰 Initial Reward Pool: ${ethers.formatEther(farmRewardAmount)} SHAH`);
    console.log(`⚡ Reward Rate: ${ethers.formatEther(rewardRatePerSecond)} SHAH/second`);
    console.log(`🏊 Total Pools: ${await shahFarm.poolLength()}`);
    console.log(`💸 Liquidity Fee: 0.3%`);
    console.log(`🔄 Auto-compound Threshold: ${ethers.formatEther(autoCompoundThreshold)} SHAH`);
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

// Execute deployment
main()
    .then((result) => {
        console.log("\n✅ Deployment script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
