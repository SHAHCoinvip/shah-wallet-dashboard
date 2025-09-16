const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Verifying ShahSwap DEX V3 contracts on Etherscan...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment file not found. Run deploy-dex-v3.cjs first.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const { contracts } = deploymentInfo;
    
    console.log("📋 Verifying contracts:");
    console.log("Factory:", contracts.ShahSwapFactoryV3.address);
    console.log("Router:", contracts.ShahSwapRouterV3.address);
    
    try {
        // Verify ShahSwapFactoryV3
        console.log("\n🏭 Verifying ShahSwapFactoryV3...");
        await hre.run("verify:verify", {
            address: contracts.ShahSwapFactoryV3.address,
            constructorArguments: contracts.ShahSwapFactoryV3.constructorArgs,
        });
        console.log("✅ ShahSwapFactoryV3 verified!");
        
        // Wait a bit between verifications
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verify ShahSwapRouterV3
        console.log("\n🛣️ Verifying ShahSwapRouterV3...");
        await hre.run("verify:verify", {
            address: contracts.ShahSwapRouterV3.address,
            constructorArguments: contracts.ShahSwapRouterV3.constructorArgs,
        });
        console.log("✅ ShahSwapRouterV3 verified!");
        
        console.log("\n🎉 All contracts verified successfully!");
        console.log("Factory:", contracts.ShahSwapFactoryV3.address);
        console.log("Router:", contracts.ShahSwapRouterV3.address);
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.log("\n💡 If contracts are already verified, this is normal.");
        console.log("You can check verification status on Etherscan:");
        console.log("Factory: https://etherscan.io/address/" + contracts.ShahSwapFactoryV3.address);
        console.log("Router: https://etherscan.io/address/" + contracts.ShahSwapRouterV3.address);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification script failed:", error);
        process.exit(1);
    });