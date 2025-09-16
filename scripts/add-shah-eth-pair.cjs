const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("📊 Adding SHAH-ETH pair to Oracle...\n");

    const [deployer] = await ethers.getSigners();
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Oracle: ${ORACLE_ADDRESS}`);
    console.log(`SHAH Token: ${SHAH_TOKEN}`);
    console.log(`WETH: ${WETH_ADDRESS}\n`);

    try {
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
        
        // You'll need to provide the actual SHAH-ETH pair address
        // This can be found by checking your factory contract or existing pairs
        console.log("💡 To add the SHAH-ETH pair, you need the pair address.");
        console.log("   You can find this by:");
        console.log("   1. Checking your factory contract");
        console.log("   2. Looking at existing transactions");
        console.log("   3. Using a block explorer\n");
        
        console.log("📝 Manual addition command:");
        console.log(`   oracle.addPair("PAIR_ADDRESS", "${SHAH_TOKEN}", "${WETH_ADDRESS}")`);
        
        // If you know the pair address, uncomment and modify this:
        // const pairAddress = "0x..."; // Replace with actual pair address
        // const tx = await oracle.addPair(pairAddress, SHAH_TOKEN, WETH_ADDRESS);
        // console.log(`✅ SHAH-ETH pair added: ${pairAddress}`);
        // console.log(`   Transaction: ${tx.hash}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);
