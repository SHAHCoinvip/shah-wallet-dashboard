const { ethers } = require("hardhat");

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🚀 Deploying ShahSwap Oracle with explicit gas settings...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Deploying with account: ${deployer.address}`);
        
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

        // Contract addresses from environment
        const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
        const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        
        if (!FACTORY_ADDRESS) {
            throw new Error("FACTORY_ADDRESS not found in environment variables");
        }

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY_ADDRESS}`);
        console.log(`   WETH: ${WETH_ADDRESS}\n`);

        // Get current gas price
        const feeData = await ethers.provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        console.log(`⛽ Current gas price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);

        // Deploy Oracle with explicit gas settings
        console.log("📦 Deploying ShahSwap Oracle...");
        const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
        
        // Estimate gas first
        const deploymentData = ShahSwapOracle.getDeployTransaction(FACTORY_ADDRESS, WETH_ADDRESS);
        const estimatedGas = await ethers.provider.estimateGas(deploymentData);
        console.log(`📊 Estimated gas: ${estimatedGas.toString()}`);
        
        // Deploy with explicit gas settings
        const oracle = await ShahSwapOracle.deploy(FACTORY_ADDRESS, WETH_ADDRESS, {
            gasLimit: estimatedGas + 50000n, // Add buffer
            gasPrice: gasPrice,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        });
        
        console.log("⏳ Waiting for deployment confirmation...");
        console.log(`📝 Transaction hash: ${oracle.deploymentTransaction().hash}`);
        
        await oracle.waitForDeployment();
        
        const oracleAddress = await oracle.getAddress();
        console.log(`✅ ShahSwap Oracle deployed to: ${oracleAddress}`);

        // Save deployment info
        const deploymentInfo = {
            network: "mainnet",
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            transactionHash: oracle.deploymentTransaction().hash,
            oracle: {
                name: "ShahSwapOracle",
                address: oracleAddress,
                constructorArgs: [FACTORY_ADDRESS, WETH_ADDRESS],
                gasUsed: estimatedGas.toString(),
                gasPrice: gasPrice.toString()
            }
        };

        const fs = require("fs");
        const path = require("path");
        const deploymentPath = path.join(__dirname, "..", "oracle-deployment.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        
        console.log("\n🎉 Oracle Deployment Complete!");
        console.log(`📋 Oracle Address: ${oracleAddress}`);
        console.log(`🔗 Etherscan: https://etherscan.io/address/${oracleAddress}`);
        console.log(`📄 Deployment info saved to: ${deploymentPath}`);

    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        if (error.message.includes("network")) {
            console.log("💡 Try using a different RPC endpoint or check your internet connection");
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
