const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying ShahSwap DEX V3...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Addresses (Mainnet)
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ORACLE = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const TREASURY = "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4";

    console.log("\n📋 Deployment Configuration:");
    console.log("WETH:", WETH);
    console.log("Oracle:", ORACLE);
    console.log("Treasury (feeTo):", TREASURY);

    // Deploy ShahSwapFactoryV3
    console.log("\n🏭 Deploying ShahSwapFactoryV3...");
    const ShahSwapFactoryV3 = await ethers.getContractFactory("ShahSwapFactoryV3");
    const factory = await ShahSwapFactoryV3.deploy();
    await factory.waitForDeployment();
    console.log("✅ ShahSwapFactoryV3 deployed to:", await factory.getAddress());

    // Set feeTo to treasury
    console.log("\n💰 Setting feeTo to treasury...");
    const setFeeToTx = await factory.setFeeTo(TREASURY);
    await setFeeToTx.wait();
    console.log("✅ feeTo set to:", TREASURY);

    // Deploy ShahSwapRouterV3
    console.log("\n🛣️ Deploying ShahSwapRouterV3...");
    const ShahSwapRouterV3 = await ethers.getContractFactory("ShahSwapRouterV3");
    const router = await ShahSwapRouterV3.deploy(await factory.getAddress(), WETH, ORACLE);
    await router.waitForDeployment();
    console.log("✅ ShahSwapRouterV3 deployed to:", await router.getAddress());

    // Verify INIT_CODE_PAIR_HASH
    console.log("\n🔍 Verifying INIT_CODE_PAIR_HASH...");
    const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
    console.log("INIT_CODE_PAIR_HASH:", initCodeHash);

    // Save deployment info
    const deploymentInfo = {
        network: "mainnet",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            ShahSwapFactoryV3: {
                address: await factory.getAddress(),
                constructorArgs: []
            },
            ShahSwapRouterV3: {
                address: await router.getAddress(),
                constructorArgs: [await factory.getAddress(), WETH, ORACLE]
            }
        },
        configuration: {
            WETH,
            ORACLE,
            TREASURY,
            INIT_CODE_PAIR_HASH: initCodeHash
        }
    };

    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to:", deploymentPath);

    console.log("\n🎉 DEX V3 Deployment Complete!");
    console.log("Factory:", await factory.getAddress());
    console.log("Router:", await router.getAddress());
    console.log("\nNext steps:");
    console.log("1. npm run dex:verify");
    console.log("2. npm run dex:pairs");
    console.log("3. npm run dex:seed");
    console.log("4. npm run dex:oracle");
    console.log("5. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });