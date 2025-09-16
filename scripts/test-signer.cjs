const { ethers } = require("hardhat");

// Load environment variables first
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Testing signer configuration...");
    
    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`✅ Signer address: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
        
        // Test environment variables
        console.log(`\n📋 Environment variables:`);
        console.log(`   PRIVATE_KEY: ${process.env.PRIVATE_KEY ? 'Set' : 'Not set'}`);
        console.log(`   FACTORY: ${process.env.NEXT_PUBLIC_FACTORY}`);
        console.log(`   SHAH: ${process.env.NEXT_PUBLIC_SHAH}`);
        console.log(`   ETHERSCAN_KEY: ${process.env.ETHERSCAN_KEY ? 'Set' : 'Not set'}`);
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
