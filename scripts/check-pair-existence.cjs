const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Pair Contract Existence...\n");

    const EXISTING_PAIRS = {
        "SHAH/USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
        "SHAH/DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
        "SHAH/ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e"
    };

    for (const [pairName, pairAddress] of Object.entries(EXISTING_PAIRS)) {
        console.log(`   ${pairName} (${pairAddress}):`);
        
        try {
            const code = await ethers.provider.getCode(pairAddress);
            console.log(`     Code length: ${code.length}`);
            console.log(`     Is contract: ${code !== '0x'}`);
            
            if (code !== '0x') {
                console.log(`     ✅ Contract exists`);
            } else {
                console.log(`     ❌ No contract at this address`);
            }
        } catch (error) {
            console.log(`     ❌ Error: ${error.message}`);
        }
        console.log("");
    }
}

main().catch(console.error);
