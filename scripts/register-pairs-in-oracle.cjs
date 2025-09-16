const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔮 Registering pairs in Oracle...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    
    if (!fs.existsSync(deploymentPath) || !fs.existsSync(pairPath)) {
        throw new Error("Deployment files not found. Run deploy-dex-v3.cjs and create-pairs.cjs first.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    
    const oracleAddress = deploymentInfo.configuration.ORACLE;
    const pairs = pairInfo.pairs;
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    
    // Connect to oracle
    const oracle = await ethers.getContractAt("IShahSwapOracle", oracleAddress);
    
    console.log("\n📋 Oracle Configuration:");
    console.log("Oracle address:", oracleAddress);
    console.log("Pairs to register:", pairs.length);
    
    for (const pair of pairs) {
        console.log(`\n🔮 Registering ${pair.name} in Oracle...`);
        console.log("Pair address:", pair.address);
        console.log("Token0:", pair.tokenA);
        console.log("Token1:", pair.tokenB);
        
        try {
            // Check if pair is already registered
            const isRegistered = await oracle.pairs(pair.address);
            if (isRegistered) {
                console.log("✅ Pair already registered in Oracle");
                continue;
            }
            
            // Register the pair
            console.log("📝 Registering pair...");
            const tx = await oracle.addPair(pair.address, pair.tokenA, pair.tokenB);
            console.log("Transaction hash:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ Pair registered in block:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            
            // Verify registration
            const isNowRegistered = await oracle.pairs(pair.address);
            if (isNowRegistered) {
                console.log("✅ Registration confirmed");
            } else {
                console.log("❌ Registration verification failed");
            }
            
        } catch (error) {
            console.error(`❌ Failed to register ${pair.name}:`, error.message);
            
            // Check if it's a "pair already exists" error
            if (error.message.includes("already exists") || error.message.includes("PAIR_EXISTS")) {
                console.log("ℹ️  Pair already exists in Oracle, continuing...");
            } else {
                throw error;
            }
        }
    }
    
    console.log("\n🎉 Oracle registration complete!");
    console.log("\nNext step:");
    console.log("1. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Oracle registration failed:", error);
        process.exit(1);
    });