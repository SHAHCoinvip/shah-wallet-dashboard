const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔄 Redeploying ShahSwapRouterV3 with correct INIT_CODE_PAIR_HASH...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

    // Load existing deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment file not found. Run complete-deployment.cjs first.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const factoryAddress = deploymentInfo.contracts.ShahSwapFactoryV3.address;
    const WETH = deploymentInfo.configuration.WETH;
    const ORACLE = deploymentInfo.configuration.ORACLE;
    
    console.log("\n📋 Configuration:");
    console.log("Factory:", factoryAddress);
    console.log("WETH:", WETH);
    console.log("Oracle:", ORACLE);

    // Deploy new ShahSwapRouterV3
    console.log("\n🛣️ Deploying new ShahSwapRouterV3...");
    const ShahSwapRouterV3 = await ethers.getContractFactory("ShahSwapRouterV3");
    const router = await ShahSwapRouterV3.deploy(factoryAddress, WETH, ORACLE);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("✅ New ShahSwapRouterV3 deployed to:", routerAddress);

    // Update deployment info
    deploymentInfo.contracts.ShahSwapRouterV3.address = routerAddress;
    deploymentInfo.contracts.ShahSwapRouterV3.constructorArgs = [factoryAddress, WETH, ORACLE];
    deploymentInfo.timestamp = new Date().toISOString();

    // Save updated deployment info
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Updated deployment info saved");

    // Verify the new router
    console.log("\n🔍 Verifying new router on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: routerAddress,
            constructorArguments: [factoryAddress, WETH, ORACLE],
        });
        console.log("✅ New router verified!");
        console.log("🔗 Etherscan: https://etherscan.io/address/" + routerAddress + "#code");
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.log("🔗 Check manually: https://etherscan.io/address/" + routerAddress);
    }

    console.log("\n🎉 Router redeployment complete!");
    console.log("New Router:", routerAddress);
    console.log("\nNext steps:");
    console.log("1. npm run dex:seed");
    console.log("2. npm run dex:oracle");
    console.log("3. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Router redeployment failed:", error);
        process.exit(1);
    });
