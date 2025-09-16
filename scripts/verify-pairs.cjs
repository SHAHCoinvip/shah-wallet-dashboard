const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Verifying ShahSwap pair contracts on Etherscan...");
    
    // Load pair info
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    if (!fs.existsSync(pairPath)) {
        throw new Error("Pair deployment file not found. Run create-pairs.cjs first.");
    }
    
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    const pairs = pairInfo.pairs;
    
    console.log("📋 Verifying pairs:");
    pairs.forEach(pair => {
        console.log(`${pair.name}: ${pair.address}`);
    });
    
    for (const pair of pairs) {
        console.log(`\n🔍 Verifying ${pair.name}...`);
        console.log("Address:", pair.address);
        
        try {
            // Verify the pair contract (no constructor arguments)
            await hre.run("verify:verify", {
                address: pair.address,
                constructorArguments: [],
            });
            console.log(`✅ ${pair.name} verified!`);
            console.log(`🔗 Etherscan: https://etherscan.io/address/${pair.address}#code`);
            
            // Wait a bit between verifications
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.error(`❌ Verification failed for ${pair.name}:`, error.message);
            console.log(`💡 Check manually: https://etherscan.io/address/${pair.address}`);
            
            // Check if it's already verified
            if (error.message.includes("already verified") || error.message.includes("Already Verified")) {
                console.log(`✅ ${pair.name} is already verified!`);
            }
        }
    }
    
    console.log("\n🎉 Pair verification complete!");
    console.log("\n📋 All Pair Contracts:");
    pairs.forEach(pair => {
        console.log(`${pair.name}: https://etherscan.io/address/${pair.address}#code`);
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Pair verification failed:", error);
        process.exit(1);
    });
