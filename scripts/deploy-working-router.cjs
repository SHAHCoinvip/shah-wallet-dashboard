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
    console.log("🚀 Deploying Working ShahSwapRouterVS2 with Uniswap V2 Factory...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Use Uniswap V2 factory instead of broken ShahSwap factory
        const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // Standard Uniswap V2 Factory
        const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

        console.log("📋 Configuration:");
        console.log(`   Uniswap V2 Factory: ${UNISWAP_V2_FACTORY}`);
        console.log(`   WETH: ${WETH}\n`);

        // Deploy ShahSwapRouterVS2 with Uniswap V2 factory
        console.log("🏗️  Deploying ShahSwapRouterVS2 with Uniswap V2 factory...");
        const ShahSwapRouterVS2 = await ethers.getContractFactory("ShahSwapRouterVS2");
        
        const router = await ShahSwapRouterVS2.deploy(UNISWAP_V2_FACTORY, WETH);
        await router.waitForDeployment();
        
        const routerAddress = await router.getAddress();
        console.log(`✅ ShahSwapRouterVS2 deployed to: ${routerAddress}`);

        // Verify deployment
        console.log("\n🔍 Verifying deployment...");
        const factoryAddress = await router.factory();
        const wethAddress = await router.WETH();
        
        console.log(`   Factory: ${factoryAddress}`);
        console.log(`   WETH: ${wethAddress}`);
        
        if (factoryAddress === UNISWAP_V2_FACTORY && wethAddress === WETH) {
            console.log("   ✅ Configuration verified");
        } else {
            console.log("   ❌ Configuration mismatch");
        }

        // Test the router with a simple function
        console.log("\n🧪 Testing router functions...");
        try {
            const quote = await router.quote(
                ethers.parseEther("1"), // 1 SHAH
                ethers.parseEther("1000"), // 1000 reserveA
                ethers.parseUnits("3000", 6) // 3000 USDT reserveB
            );
            console.log(`   ✅ Quote function works: 1 SHAH = ${ethers.formatUnits(quote, 6)} USDT`);
        } catch (error) {
            console.log(`   ❌ Quote function failed: ${error.message}`);
        }

        // Save deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            network: "mainnet",
            deployer: deployer.address,
            contractName: "ShahSwapRouterVS2_Working",
            contractAddress: routerAddress,
            constructorArgs: {
                factory: UNISWAP_V2_FACTORY,
                weth: WETH
            },
            transactionHash: router.deploymentTransaction().hash,
            blockNumber: await ethers.provider.getBlockNumber(),
            gasUsed: (await router.deploymentTransaction().wait()).gasUsed.toString(),
            status: "SUCCESS",
            note: "Uses Uniswap V2 factory instead of broken ShahSwap factory"
        };

        // Save to deployment file
        const deploymentPath = path.join(__dirname, "..", "deployments", "shahswaproutervs2-working.json");
        const deploymentDir = path.dirname(deploymentPath);
        
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n💾 Deployment info saved to: deployments/shahswaproutervs2-working.json`);

        // Update main deployment file
        const mainDeploymentPath = path.join(__dirname, "..", "deployment.json");
        let mainDeployment = {};
        
        if (fs.existsSync(mainDeploymentPath)) {
            mainDeployment = JSON.parse(fs.readFileSync(mainDeploymentPath, "utf8"));
        }
        
        mainDeployment.SHAHSWAP_ROUTER_VS2_WORKING = routerAddress;
        mainDeployment.SHAHSWAP_ROUTER_VS2_WORKING_DEPLOYED_AT = new Date().toISOString();
        
        fs.writeFileSync(mainDeploymentPath, JSON.stringify(mainDeployment, null, 2));
        console.log(`💾 Updated main deployment file: deployment.json`);

        console.log("\n🎉 Working ShahSwapRouterVS2 Deployment Complete!");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n📊 Deployment Summary:");
        console.log(`   Contract: ShahSwapRouterVS2 (Working Version)`);
        console.log(`   Address: ${routerAddress}`);
        console.log(`   Factory: ${UNISWAP_V2_FACTORY} (Uniswap V2 Factory)`);
        console.log(`   WETH: ${WETH}`);
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Transaction: ${router.deploymentTransaction().hash}`);

        console.log("\n🔗 Contract Links:");
        console.log(`   ShahSwapRouterVS2 (Working): https://etherscan.io/address/${routerAddress}`);
        console.log(`   Uniswap V2 Factory: https://etherscan.io/address/${UNISWAP_V2_FACTORY}`);
        console.log(`   WETH: https://etherscan.io/address/${WETH}`);

        console.log("\n💡 Key Differences:");
        console.log("   • Uses Uniswap V2 factory (working) instead of ShahSwap factory (broken)");
        console.log("   • Will create pairs properly when adding liquidity");
        console.log("   • Compatible with all Uniswap V2 pairs and liquidity");

        console.log("\n🎯 Next Steps:");
        console.log("   1. Test liquidity functions with working router");
        console.log("   2. Verify pairs are created properly");
        console.log("   3. Update frontend with working router address");
        console.log("   4. Test all router functions in production");

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
