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
    console.log("🚀 Deploying ShahSwapRouterVS2...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   WETH: ${WETH}\n`);

        // Deploy ShahSwapRouterVS2
        console.log("🏗️  Deploying ShahSwapRouterVS2 contract...");
        const ShahSwapRouterVS2 = await ethers.getContractFactory("ShahSwapRouterVS2");
        
        const router = await ShahSwapRouterVS2.deploy(FACTORY, WETH);
        await router.waitForDeployment();
        
        const routerAddress = await router.getAddress();
        console.log(`✅ ShahSwapRouterVS2 deployed to: ${routerAddress}`);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const factoryAddress = await router.factory();
        const wethAddress = await router.WETH();
        
        console.log(`   Factory: ${factoryAddress}`);
        console.log(`   WETH: ${wethAddress}`);
        
        if (factoryAddress === FACTORY && wethAddress === WETH) {
            console.log("   ✅ Configuration verified");
        } else {
            console.log("   ❌ Configuration mismatch");
        }

        // Save deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            network: "mainnet",
            deployer: deployer.address,
            contractName: "ShahSwapRouterVS2",
            contractAddress: routerAddress,
            constructorArgs: {
                factory: FACTORY,
                weth: WETH
            },
            transactionHash: router.deploymentTransaction().hash,
            blockNumber: await ethers.provider.getBlockNumber(),
            gasUsed: (await router.deploymentTransaction().wait()).gasUsed.toString(),
            status: "SUCCESS"
        };

        // Save to deployment file
        const deploymentPath = path.join(__dirname, "..", "deployments", "shahswaproutervs2.json");
        const deploymentDir = path.dirname(deploymentPath);
        
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to: deployments/shahswaproutervs2.json`);

        // Update main deployment file
        const mainDeploymentPath = path.join(__dirname, "..", "deployment.json");
        let mainDeployment = {};
        
        if (fs.existsSync(mainDeploymentPath)) {
            mainDeployment = JSON.parse(fs.readFileSync(mainDeploymentPath, "utf8"));
        }
        
        mainDeployment.SHAHSWAP_ROUTER_VS2 = routerAddress;
        mainDeployment.SHAHSWAP_ROUTER_VS2_DEPLOYED_AT = new Date().toISOString();
        
        fs.writeFileSync(mainDeploymentPath, JSON.stringify(mainDeployment, null, 2));
        console.log(`💾 Updated main deployment file: deployment.json`);

        console.log("\n🎉 ShahSwapRouterVS2 Deployment Complete!");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n📊 Deployment Summary:");
        console.log(`   Contract: ShahSwapRouterVS2`);
        console.log(`   Address: ${routerAddress}`);
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   WETH: ${WETH}`);
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Transaction: ${router.deploymentTransaction().hash}`);

        console.log("\n🔗 Contract Links:");
        console.log(`   ShahSwapRouterVS2: https://etherscan.io/address/${routerAddress}`);
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   WETH: https://etherscan.io/address/${WETH}`);

        console.log("\n🎯 Next Steps:");
        console.log("   1. Run verification script: npx hardhat run scripts/verify-shahswaproutervs2.cjs --network mainnet");
        console.log("   2. Test liquidity functions: npx hardhat run scripts/add-test-liquidity.cjs --network mainnet");
        console.log("   3. Update frontend with new router address");

        console.log("\n💡 Usage Example:");
        console.log(`   const router = await ethers.getContractAt("ShahSwapRouterVS2", "${routerAddress}");`);
        console.log(`   await router.addLiquidity(tokenA, tokenB, amountA, amountB, minA, minB, to, deadline);`);

    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
