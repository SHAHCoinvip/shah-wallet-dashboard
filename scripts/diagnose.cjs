const { ethers } = require("hardhat");

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Diagnosing deployment issues...\n");

    try {
        // 1. Check environment variables
        console.log("📋 Environment Variables:");
        console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? 'Set' : 'Not set'}`);
        console.log(`   FACTORY: ${process.env.NEXT_PUBLIC_FACTORY || 'Not set'}`);
        console.log(`   RPC URL: ${process.env.NEXT_PUBLIC_RPC_MAINNET || 'Using default'}`);
        console.log(`   ETHERSCAN_KEY: ${process.env.ETHERSCAN_KEY ? 'Set' : 'Not set'}\n`);

        // 2. Test network connection
        console.log("🌐 Testing network connection...");
        const provider = ethers.provider;
        
        try {
            const network = await provider.getNetwork();
            console.log(`✅ Network: ${network.name} (chainId: ${network.chainId})`);
        } catch (error) {
            console.log(`❌ Network connection failed: ${error.message}`);
            return;
        }

        // 3. Test signer
        console.log("\n👤 Testing signer...");
        try {
            const [deployer] = await ethers.getSigners();
            if (!deployer) {
                console.log("❌ No deployer account found");
                return;
            }
            console.log(`✅ Deployer address: ${deployer.address}`);
            
            const balance = await ethers.provider.getBalance(deployer.address);
            console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
            
            if (balance === 0n) {
                console.log("❌ Insufficient balance for deployment");
                return;
            }
        } catch (error) {
            console.log(`❌ Signer test failed: ${error.message}`);
            return;
        }

        // 4. Test gas estimation
        console.log("\n⛽ Testing gas estimation...");
        try {
            const gasPrice = await ethers.provider.getFeeData();
            console.log(`✅ Gas price: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
        } catch (error) {
            console.log(`❌ Gas estimation failed: ${error.message}`);
        }

        // 5. Test contract compilation
        console.log("\n📦 Testing contract compilation...");
        try {
            const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
            console.log("✅ ShahSwapOracle contract compiled successfully");
        } catch (error) {
            console.log(`❌ Contract compilation failed: ${error.message}`);
        }

        console.log("\n✅ Diagnosis complete! If all tests passed, try the deployment again.");
        console.log("💡 If deployment still hangs, try:");
        console.log("   1. Using a different RPC endpoint");
        console.log("   2. Increasing gas limit in hardhat.config.cjs");
        console.log("   3. Setting a specific gas price");

    } catch (error) {
        console.error("❌ Diagnosis failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
