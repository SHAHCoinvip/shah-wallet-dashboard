const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying ShahSwapRouterVS3...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Contract addresses (Ethereum mainnet)
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ORACLE_ADDRESS = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";

    console.log("🏭 Factory:", FACTORY_ADDRESS);
    console.log("💎 WETH:", WETH_ADDRESS);
    console.log("🔮 Oracle:", ORACLE_ADDRESS);

    // Deploy ShahSwapRouterVS3
    const ShahSwapRouterVS3 = await ethers.getContractFactory("ShahSwapRouterVS3");
    
    console.log("⏳ Deploying contract...");
    const router = await ShahSwapRouterVS3.deploy(
        FACTORY_ADDRESS,
        WETH_ADDRESS,
        ORACLE_ADDRESS
    );

    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("✅ ShahSwapRouterVS3 deployed to:", routerAddress);

    // Save deployment info
    const deploymentInfo = {
        contractName: "ShahSwapRouterVS3",
        address: routerAddress,
        factory: FACTORY_ADDRESS,
        weth: WETH_ADDRESS,
        oracle: ORACLE_ADDRESS,
        deployer: await deployer.getAddress(),
        blockNumber: await ethers.provider.getBlockNumber(),
        timestamp: new Date().toISOString(),
        network: "mainnet"
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `ShahSwapRouterVS3-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);

    // Update frontend config files
    await updateFrontendConfigs(routerAddress);

    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
        await hre.run("verify:verify", {
            address: routerAddress,
            constructorArguments: [FACTORY_ADDRESS, WETH_ADDRESS, ORACLE_ADDRESS],
        });
        console.log("✅ Contract verified on Etherscan!");
        console.log(`🔗 Etherscan: https://etherscan.io/address/${routerAddress}#code`);
    } catch (error) {
        console.log("❌ Verification failed:", error.message);
        console.log("📝 Manual verification command:");
        console.log(`npx hardhat verify --network mainnet ${routerAddress} ${FACTORY_ADDRESS} ${WETH_ADDRESS} ${ORACLE_ADDRESS}`);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Summary:");
    console.log("  Contract: ShahSwapRouterVS3");
    console.log("  Address:", routerAddress);
    console.log("  Factory:", FACTORY_ADDRESS);
    console.log("  WETH:", WETH_ADDRESS);
    console.log("  Oracle:", ORACLE_ADDRESS);
}

async function updateFrontendConfigs(routerAddress) {
    console.log("📝 Updating frontend configuration files...");

    // Update frontend-config.json
    const frontendConfigPath = path.join(__dirname, "..", "frontend-config.json");
    if (fs.existsSync(frontendConfigPath)) {
        const config = JSON.parse(fs.readFileSync(frontendConfigPath, "utf8"));
        config.contracts.ShahSwapRouterVS3 = routerAddress;
        fs.writeFileSync(frontendConfigPath, JSON.stringify(config, null, 2));
        console.log("✅ Updated frontend-config.json");
    }

    // Update src/config/shah-constants.ts
    const constantsPath = path.join(__dirname, "..", "src", "config", "shah-constants.ts");
    if (fs.existsSync(constantsPath)) {
        let constantsContent = fs.readFileSync(constantsPath, "utf8");
        
        // Update or add ShahSwapRouterVS3 address
        const routerRegex = /export const SHAHSWAP_ROUTER_VS3 = "0x[a-fA-F0-9]{40}";/;
        const newRouterLine = `export const SHAHSWAP_ROUTER_VS3 = "${routerAddress}";`;
        
        if (routerRegex.test(constantsContent)) {
            constantsContent = constantsContent.replace(routerRegex, newRouterLine);
        } else {
            // Add the export if it doesn't exist
            constantsContent += `\n${newRouterLine}\n`;
        }
        
        fs.writeFileSync(constantsPath, constantsContent);
        console.log("✅ Updated src/config/shah-constants.ts");
    }

    // Update .env.local
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf8");
        
        // Update or add NEXT_PUBLIC_SHAHSWAP_ROUTER_VS3
        const routerEnvRegex = /NEXT_PUBLIC_SHAHSWAP_ROUTER_VS3=0x[a-fA-F0-9]{40}/;
        const newRouterEnvLine = `NEXT_PUBLIC_SHAHSWAP_ROUTER_VS3=${routerAddress}`;
        
        if (routerEnvRegex.test(envContent)) {
            envContent = envContent.replace(routerEnvRegex, newRouterEnvLine);
        } else {
            envContent += `\n${newRouterEnvLine}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log("✅ Updated .env.local");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
