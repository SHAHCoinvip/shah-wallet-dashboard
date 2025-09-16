const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔧 Initializing ShahSwap pairs...");
    
    // Load pair info
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    if (!fs.existsSync(pairPath)) {
        throw new Error("Pair deployment file not found. Run create-pairs.cjs first.");
    }
    
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    const pairs = pairInfo.pairs;
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    
    console.log("\n📋 Initializing pairs:");
    pairs.forEach(pair => {
        console.log(`${pair.name}: ${pair.address}`);
    });
    
    for (const pair of pairs) {
        console.log(`\n🔧 Initializing ${pair.name}...`);
        console.log("Address:", pair.address);
        console.log("Token0:", pair.tokenA);
        console.log("Token1:", pair.tokenB);
        
        try {
            // Connect to pair contract
            const pairContract = await ethers.getContractAt("contracts/shahswap/ShahSwapPair.sol:ShahSwapPair", pair.address);
            
            // Check if already initialized
            const token0 = await pairContract.token0();
            const token1 = await pairContract.token1();
            
            if (token0 !== ethers.ZeroAddress && token1 !== ethers.ZeroAddress) {
                console.log("✅ Pair already initialized");
                console.log("Token0:", token0);
                console.log("Token1:", token1);
                continue;
            }
            
            // Initialize the pair
            console.log("📝 Initializing pair...");
            const tx = await pairContract.initialize(pair.tokenA, pair.tokenB);
            console.log("Transaction hash:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ Pair initialized in block:", receipt.blockNumber);
            console.log("Gas used:", receipt.gasUsed.toString());
            
            // Verify initialization
            const newToken0 = await pairContract.token0();
            const newToken1 = await pairContract.token1();
            console.log("✅ Initialization confirmed");
            console.log("Token0:", newToken0);
            console.log("Token1:", newToken1);
            
        } catch (error) {
            console.error(`❌ Failed to initialize ${pair.name}:`, error.message);
            
            // Check if it's already initialized
            if (error.message.includes("already initialized") || error.message.includes("INITIALIZED")) {
                console.log("ℹ️  Pair already initialized, continuing...");
            } else {
                throw error;
            }
        }
    }
    
    console.log("\n🎉 Pair initialization complete!");
    console.log("\nNext steps:");
    console.log("1. npm run dex:seed");
    console.log("2. npm run dex:oracle");
    console.log("3. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Pair initialization failed:", error);
        process.exit(1);
    });
