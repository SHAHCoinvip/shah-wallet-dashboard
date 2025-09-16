const hre = require("hardhat");

// Oracle and factory addresses
const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
const CURRENT_FACTORY = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";
const CORRECT_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";

async function main() {
    console.log("\n🔄 Updating Oracle Factory...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    try {
        const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS, signer);
        
        // Check ownership
        const owner = await oracle.owner();
        console.log("🏛️  Oracle owner:", owner);
        
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.log("❌ Current signer is NOT the oracle owner");
            return;
        }
        
        console.log("✅ Current signer IS the oracle owner");
        
        // Check current factory
        const currentFactory = await oracle.factory();
        console.log("🏭 Current factory:", currentFactory);
        console.log("🎯 Target factory:", CORRECT_FACTORY);
        
        if (currentFactory.toLowerCase() === CORRECT_FACTORY.toLowerCase()) {
            console.log("✅ Oracle is already using the correct factory");
            return;
        }
        
        console.log("🔄 Oracle needs factory update");
        
        // Check if oracle has an update function
        try {
            // Try to find an update function
            const updateFunction = oracle.updateFactory || oracle.setFactory || oracle.transferOwnership;
            
            if (updateFunction) {
                console.log("🔧 Oracle has update function, attempting update...");
                // This would need the actual function name and parameters
                console.log("💡 Manual update required - check oracle contract for update function");
            } else {
                console.log("❌ Oracle has no update function");
            }
        } catch (error) {
            console.log("❌ Could not check for update function:", error.message);
        }
        
        console.log("\n📝 Summary:");
        console.log("The oracle is configured with factory:", CURRENT_FACTORY);
        console.log("But our LP pairs exist in factory:", CORRECT_FACTORY);
        console.log("\n💡 Solutions:");
        console.log("1. Update oracle to use correct factory (requires oracle upgrade function)");
        console.log("2. Create pairs in oracle's current factory (if possible)");
        console.log("3. Deploy new oracle with correct factory");
        
        console.log("\n🔍 Checking if we can create pairs in oracle's current factory...");
        
        try {
            const factory = await hre.ethers.getContractAt("ShahSwapFactory", CURRENT_FACTORY, signer);
            
            // Try to create a test pair
            const testPair = await factory.createPair.staticCall(
                "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH
            );
            console.log("✅ Can create pairs in oracle's current factory");
            console.log("   Test pair would be at:", testPair);
            
            console.log("\n💡 Recommendation: Create pairs in oracle's current factory");
            console.log("   This is simpler than updating the oracle");
            
        } catch (error) {
            console.log("❌ Cannot create pairs in oracle's current factory:", error.message);
            console.log("\n💡 Recommendation: Update oracle to use correct factory");
        }
        
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

