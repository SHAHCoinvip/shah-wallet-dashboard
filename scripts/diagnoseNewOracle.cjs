const hre = require("hardhat");

// New Oracle address
const NEW_ORACLE_ADDRESS = "0x608475033ac2c8B779043FB6F9B53d0633C7c79a";

async function main() {
    console.log("\n🔍 Diagnosing New Oracle...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    try {
        const oracle = await hre.ethers.getContractAt("ShahSwapOracle", NEW_ORACLE_ADDRESS, signer);
        
        console.log("✅ Contract found at address");
        
        // Check basic properties
        try {
            const owner = await oracle.owner();
            console.log("🏛️  Owner:", owner);
            
            const factory = await oracle.factory();
            console.log("🏭 Factory:", factory);
            
            const weth = await oracle.WETH();
            console.log("💧 WETH:", weth);
            
            const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
            console.log("💰 Minimum liquidity:", hre.ethers.formatEther(minLiquidity), "tokens");
            
            const defaultTwapPeriod = await oracle.DEFAULT_TWAP_PERIOD();
            console.log("⏱️  Default TWAP period:", defaultTwapPeriod.toString(), "seconds");
            
        } catch (error) {
            console.log("❌ Error reading basic properties:", error.message);
        }
        
        // Check if pairs are already supported
        const testPairs = [
            "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e", // SHAH/ETH
            "0x4c741106D435a6167d1117B1f37f1Eb584639C66", // SHAH/USDT
            "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048", // SHAH/DAI
        ];
        
        console.log("\n🔍 Checking pair support status...");
        for (let i = 0; i < testPairs.length; i++) {
            try {
                const isSupported = await oracle.isPairSupported(testPairs[i]);
                console.log(`   Pair ${i}: ${isSupported ? "✅ Supported" : "❌ Not supported"}`);
            } catch (error) {
                console.log(`   Pair ${i}: ❌ Error checking: ${error.message}`);
            }
        }
        
        // Try to get cumulative prices for a pair
        console.log("\n🔍 Checking cumulative prices...");
        try {
            const [price0, price1, timestamp, initialized] = await oracle.getCumulativePrices(testPairs[0]);
            console.log(`   SHAH/ETH pair cumulative prices:`);
            console.log(`     Price0: ${price0.toString()}`);
            console.log(`     Price1: ${price1.toString()}`);
            console.log(`     Timestamp: ${timestamp.toString()}`);
            console.log(`     Initialized: ${initialized}`);
        } catch (error) {
            console.log("❌ Error getting cumulative prices:", error.message);
        }
        
        // Check if we can call addPair with a static call first
        console.log("\n🔍 Testing addPair with static call...");
        try {
            const result = await oracle.addPair.staticCall(
                "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e", // SHAH/ETH pair
                "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH token
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH token
            );
            console.log("✅ Static call to addPair succeeded");
        } catch (error) {
            console.log("❌ Static call to addPair failed:", error.message);
            
            // Try to understand the error better
            if (error.message.includes("PAIR_NOT_IN_FACTORY")) {
                console.log("💡 Error: Pair doesn't exist in factory");
            } else if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
                console.log("💡 Error: Pair doesn't meet minimum liquidity");
            } else if (error.message.includes("PAIR_ALREADY_SUPPORTED")) {
                console.log("💡 Error: Pair is already supported");
            } else if (error.message.includes("INVALID_PAIR")) {
                console.log("💡 Error: Invalid pair address");
            } else if (error.message.includes("INVALID_TOKENS")) {
                console.log("💡 Error: Invalid token addresses");
            } else {
                console.log("💡 Unknown error, might be contract initialization issue");
            }
        }
        
        console.log("\n📝 Summary:");
        console.log("The new oracle is deployed and accessible");
        console.log("But addPair function calls are reverting");
        console.log("This suggests the contract might not be fully initialized");
        
        console.log("\n💡 Possible solutions:");
        console.log("1. Wait for contract to be fully initialized");
        console.log("2. Check if contract needs additional setup");
        console.log("3. Verify contract bytecode is correct");
        console.log("4. Try manual Etherscan interaction");
        
    } catch (error) {
        console.error("❌ Script failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("Script failed:", e);
        process.exit(1);
    });

