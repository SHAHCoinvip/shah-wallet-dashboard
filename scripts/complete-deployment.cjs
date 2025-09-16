const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔄 Completing ShahSwap DEX V3 deployment...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Addresses (Mainnet)
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ORACLE = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const TREASURY = "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4";
    
    // Factory address from previous deployment
    const FACTORY_ADDRESS = "0xcE9A12D1151E6776c2da10126997c47c85Cedd48";
    
    console.log("\n📋 Configuration:");
    console.log("Factory:", FACTORY_ADDRESS);
    console.log("WETH:", WETH);
    console.log("Oracle:", ORACLE);
    console.log("Treasury:", TREASURY);

    // Connect to existing factory
    const factory = await ethers.getContractAt("ShahSwapFactoryV3", FACTORY_ADDRESS);
    
    // Set feeTo to treasury
    console.log("\n💰 Setting feeTo to treasury...");
    try {
        const setFeeToTx = await factory.setFeeTo(TREASURY);
        await setFeeToTx.wait();
        console.log("✅ feeTo set to:", TREASURY);
    } catch (error) {
        console.log("⚠️  feeTo might already be set:", error.message);
    }

    // Deploy ShahSwapRouterV3
    console.log("\n🛣️ Deploying ShahSwapRouterV3...");
    const ShahSwapRouterV3 = await ethers.getContractFactory("ShahSwapRouterV3");
    const router = await ShahSwapRouterV3.deploy(FACTORY_ADDRESS, WETH, ORACLE);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("✅ ShahSwapRouterV3 deployed to:", routerAddress);

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
                address: FACTORY_ADDRESS,
                constructorArgs: []
            },
            ShahSwapRouterV3: {
                address: routerAddress,
                constructorArgs: [FACTORY_ADDRESS, WETH, ORACLE]
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
    console.log("Factory:", FACTORY_ADDRESS);
    console.log("Router:", routerAddress);
    
    // Now verify the contracts
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
        // Verify ShahSwapFactoryV3
        console.log("\n🏭 Verifying ShahSwapFactoryV3...");
        await hre.run("verify:verify", {
            address: FACTORY_ADDRESS,
            constructorArguments: [],
        });
        console.log("✅ ShahSwapFactoryV3 verified!");
        
        // Wait a bit between verifications
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify ShahSwapRouterV3
        console.log("\n🛣️ Verifying ShahSwapRouterV3...");
        await hre.run("verify:verify", {
            address: routerAddress,
            constructorArguments: [FACTORY_ADDRESS, WETH, ORACLE],
        });
        console.log("✅ ShahSwapRouterV3 verified!");
        
        console.log("\n🎉 All contracts verified successfully!");
        console.log("Factory: https://etherscan.io/address/" + FACTORY_ADDRESS);
        console.log("Router: https://etherscan.io/address/" + routerAddress);
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.log("\n💡 If contracts are already verified, this is normal.");
        console.log("You can check verification status on Etherscan:");
        console.log("Factory: https://etherscan.io/address/" + FACTORY_ADDRESS);
        console.log("Router: https://etherscan.io/address/" + routerAddress);
    }
    
    console.log("\nNext steps:");
    console.log("1. npm run dex:pairs");
    console.log("2. npm run dex:seed");
    console.log("3. npm run dex:oracle");
    console.log("4. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment completion failed:", error);
        process.exit(1);
    });
