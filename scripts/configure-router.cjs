const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔧 Configuring ShahSwap Router V2...\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const ROUTER_ADDRESS = "0x20794d26397f2b81116005376AbEc0B995e9D502";
    const SHAH_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SHAH;
    
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`Router: ${ROUTER_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN_ADDRESS}\n`);

    try {
        // 1. Configure Router with Oracle
        console.log("📋 Configuring Router with Oracle...");
        const routerV2 = await ethers.getContractAt("ShahSwapRouterV2", ROUTER_ADDRESS);
        const setOracleTx = await routerV2.setOracle(ORACLE_ADDRESS);
        console.log(`Transaction Hash: ${setOracleTx.hash}`);
        await setOracleTx.wait();
        console.log("✅ Router configured with Oracle");

        // 2. Add SHAH-ETH pair to Oracle
        console.log("\n📋 Adding SHAH-ETH pair to Oracle...");
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
        
        // Get SHAH-ETH pair from factory
        const factory = await ethers.getContractAt("IShahSwapFactory", FACTORY_ADDRESS);
        const shahEthPair = await factory.getPair(SHAH_TOKEN_ADDRESS, WETH_ADDRESS);
        
        if (shahEthPair !== ethers.ZeroAddress) {
            const addPairTx = await oracle.addPair(shahEthPair, SHAH_TOKEN_ADDRESS, WETH_ADDRESS);
            console.log(`Transaction Hash: ${addPairTx.hash}`);
            await addPairTx.wait();
            console.log(`✅ SHAH-ETH pair added to Oracle: ${shahEthPair}`);
        } else {
            console.log("⚠️  SHAH-ETH pair not found in factory");
        }

        console.log("\n🎉 Router configuration complete!");
        console.log("📋 Configuration Summary:");
        console.log(`   Router: ${ROUTER_ADDRESS}`);
        console.log(`   Oracle: ${ORACLE_ADDRESS}`);
        console.log(`   Factory: ${FACTORY_ADDRESS}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN_ADDRESS}`);
        console.log(`   WETH: ${WETH_ADDRESS}`);

    } catch (error) {
        console.error("❌ Configuration failed:", error.message);
    }
}

main().catch(console.error);
