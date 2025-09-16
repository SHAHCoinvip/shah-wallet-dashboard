const hre = require("hardhat");

// Factory that the oracle is configured with
const FACTORY_ADDRESS = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";

async function main() {
    console.log("\n🔍 Checking Oracle Factory...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    try {
        const factory = await hre.ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS, signer);
        
        // Check factory owner
        const owner = await factory.owner();
        console.log("🏛️  Factory owner:", owner);
        
        // Check total pairs
        const totalPairs = await factory.allPairsLength();
        console.log("📊 Total pairs in factory:", totalPairs.toString());
        
        // Check specific pairs we're trying to add
        const testPairs = [
            {
                label: "SHAH/ETH",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            },
            {
                label: "SHAH/USDT",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            },
            {
                label: "SHAH/DAI",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
            }
        ];
        
        console.log("\n🔍 Checking specific pairs...");
        for (const pair of testPairs) {
            try {
                const factoryPair = await factory.getPair(pair.token0, pair.token1);
                console.log(`\n📊 ${pair.label}:`);
                console.log(`   Factory pair: ${factoryPair}`);
                console.log(`   Exists: ${factoryPair !== hre.ethers.ZeroAddress}`);
                
                if (factoryPair !== hre.ethers.ZeroAddress) {
                    console.log(`   ✅ Pair exists in this factory`);
                } else {
                    console.log(`   ❌ Pair does NOT exist in this factory`);
                    console.log(`   💡 This explains why oracle.addPair() is failing`);
                }
            } catch (error) {
                console.log(`   ❌ Error checking ${pair.label}: ${error.message}`);
            }
        }
        
        // Check if we can create pairs in this factory
        console.log("\n🔍 Checking if we can create pairs...");
        try {
            const canCreate = await factory.createPair.staticCall(
                "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH
            );
            console.log("✅ Can create SHAH/ETH pair in this factory");
            console.log("   Would create pair at:", canCreate);
        } catch (error) {
            console.log("❌ Cannot create pairs in this factory:", error.message);
        }
        
        console.log("\n📝 Summary:");
        console.log("The oracle is configured with factory:", FACTORY_ADDRESS);
        console.log("But our LP pairs were created in a different factory");
        console.log("We need to either:");
        console.log("1. Create the pairs in the oracle's factory, OR");
        console.log("2. Update the oracle to use the correct factory");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("Script failed:", e);
        process.exit(1);
    });

