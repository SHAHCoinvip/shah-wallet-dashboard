const hre = require("hardhat");

// ShahSwapOracle (already deployed)
const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
// Use the factory address that the oracle is actually configured with
const FACTORY_ADDRESS = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";

async function main() {
    console.log("\n🔍 Checking Oracle Status...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    try {
        const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS, signer);
        const factory = await hre.ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS, signer);
        
        // Check oracle ownership
        const owner = await oracle.owner();
        console.log("🏛️  Oracle owner:", owner);
        console.log("🔐 Is current signer owner?", owner.toLowerCase() === signer.address.toLowerCase());
        
        // Check factory address
        const oracleFactory = await oracle.factory();
        console.log("🏭 Oracle factory:", oracleFactory);
        console.log("🔗 Factory matches:", oracleFactory.toLowerCase() === FACTORY_ADDRESS.toLowerCase());
        
        // Check WETH address
        const oracleWETH = await oracle.WETH();
        console.log("💧 Oracle WETH:", oracleWETH);
        
        // Check minimum liquidity requirement
        const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
        console.log("💰 Minimum liquidity required:", hre.ethers.formatEther(minLiquidity), "tokens");
        
        // Test pairs to add
        const testPairs = [
            {
                label: "SHAH/ETH",
                pair: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            },
            {
                label: "SHAH/USDT",
                pair: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            },
            {
                label: "SHAH/DAI",
                pair: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
                token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
                token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
            }
        ];
        
        console.log("\n🔍 Checking pairs in factory...");
        for (const pair of testPairs) {
            try {
                // Check if pair exists in factory
                const factoryPair = await factory.getPair(pair.token0, pair.token1);
                console.log(`\n📊 ${pair.label}:`);
                console.log(`   Expected pair: ${pair.pair}`);
                console.log(`   Factory pair: ${factoryPair}`);
                console.log(`   Exists: ${factoryPair !== hre.ethers.ZeroAddress}`);
                console.log(`   Matches: ${factoryPair.toLowerCase() === pair.pair.toLowerCase()}`);
                
                if (factoryPair !== hre.ethers.ZeroAddress) {
                    // Check if pair is already supported by oracle
                    const isSupported = await oracle.isPairSupported(pair.pair);
                    console.log(`   Already in oracle: ${isSupported}`);
                    
                    // Try to get reserves to check liquidity
                    try {
                        const pairContract = await hre.ethers.getContractAt("IShahSwapPair", pair.pair);
                        const reserves = await pairContract.getReserves();
                        console.log(`   Reserves: ${hre.ethers.formatEther(reserves[0])} SHAH, ${hre.ethers.formatEther(reserves[1])} Token`);
                        
                        const minLiquidityWei = await oracle.MINIMUM_LIQUIDITY();
                        const hasMinLiquidity = reserves[0] >= minLiquidityWei && reserves[1] >= minLiquidityWei;
                        console.log(`   Meets min liquidity: ${hasMinLiquidity}`);
                    } catch (err) {
                        console.log(`   ❌ Could not check reserves: ${err.message}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ Error checking ${pair.label}: ${error.message}`);
            }
        }
        
        console.log("\n📝 Summary:");
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
            console.log("❌ Current signer is NOT the oracle owner");
            console.log("💡 You need to use the owner account to add pairs");
        } else {
            console.log("✅ Current signer IS the oracle owner");
        }
        
        if (oracleFactory.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) {
            console.log("❌ Oracle factory address doesn't match expected factory");
        } else {
            console.log("✅ Oracle factory address matches");
        }
        
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
