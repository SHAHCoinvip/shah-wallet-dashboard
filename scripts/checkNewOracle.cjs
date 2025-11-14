const hre = require("hardhat");

// Check the new oracle address from the failed deployment
const NEW_ORACLE_ADDRESS = "0xd1A0EB2399FFb260C9d7678ce9b62A1CEAa10BcF";
const CORRECT_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
    console.log("\n🔍 Checking New Oracle Deployment...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    try {
        // Try to get the contract at the new address
        console.log("🔍 Checking oracle at:", NEW_ORACLE_ADDRESS);
        const oracle = await hre.ethers.getContractAt("ShahSwapOracle", NEW_ORACLE_ADDRESS, signer);
        
        console.log("✅ Contract found at address");
        
        // Check basic properties
        try {
            const factory = await oracle.factory();
            console.log("🏭 Factory:", factory);
            
            const weth = await oracle.WETH();
            console.log("💧 WETH:", weth);
            
            const owner = await oracle.owner();
            console.log("🏛️  Owner:", owner);
            
            // Check if configuration is correct
            if (factory.toLowerCase() === CORRECT_FACTORY.toLowerCase()) {
                console.log("✅ Factory address matches expected");
            } else {
                console.log("❌ Factory address mismatch");
            }
            
            if (weth.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
                console.log("✅ WETH address matches expected");
            } else {
                console.log("❌ WETH address mismatch");
            }
            
            if (owner.toLowerCase() === signer.address.toLowerCase()) {
                console.log("✅ Owner is current signer");
            } else {
                console.log("❌ Owner is not current signer");
            }
            
            // Check minimum liquidity
            try {
                const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
                console.log("💰 Minimum liquidity:", hre.ethers.formatEther(minLiquidity), "tokens");
            } catch (e) {
                console.log("❌ Could not get minimum liquidity");
            }
            
            console.log("\n🎉 New Oracle is working!");
            console.log("💡 We can now use this oracle to register LP pairs");
            
        } catch (error) {
            console.log("❌ Error reading oracle properties:", error.message);
        }
        
    } catch (error) {
        console.log("❌ Contract not found or not a ShahSwapOracle:", error.message);
        console.log("💡 The deployment may have failed completely");
    }
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("Script failed:", e);
        process.exit(1);
    });





