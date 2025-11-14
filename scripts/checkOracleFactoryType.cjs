const hre = require("hardhat");

// Factory that the oracle is configured with
const FACTORY_ADDRESS = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";

async function main() {
    console.log("\n🔍 Checking Oracle Factory Type...\n");
    
    const [signer] = await hre.ethers.getSigners();
    console.log("👤 Current signer:", signer.address);
    
    // Try different contract types
    const contractTypes = [
        "ShahSwapFactory",
        "SHAHFactory", 
        "IUniswapV2Factory",
        "ShahSwapFactory"
    ];
    
    for (const contractType of contractTypes) {
        try {
            console.log(`\n🔍 Trying ${contractType}...`);
            const contract = await hre.ethers.getContractAt(contractType, FACTORY_ADDRESS, signer);
            
            // Try to call basic functions to see what works
            try {
                const owner = await contract.owner();
                console.log(`   ✅ Owner: ${owner}`);
            } catch (e) {
                console.log(`   ❌ No owner() function`);
            }
            
            try {
                const totalPairs = await contract.allPairsLength();
                console.log(`   ✅ Total pairs: ${totalPairs.toString()}`);
            } catch (e) {
                console.log(`   ❌ No allPairsLength() function`);
            }
            
            try {
                const feeTo = await contract.feeTo();
                console.log(`   ✅ Fee to: ${feeTo}`);
            } catch (e) {
                console.log(`   ❌ No feeTo() function`);
            }
            
            try {
                const getCreationFee = await contract.getCreationFeeInSHAH();
                console.log(`   ✅ Creation fee: ${getCreationFee.toString()}`);
            } catch (e) {
                console.log(`   ❌ No getCreationFeeInSHAH() function`);
            }
            
            console.log(`\n🎯 This appears to be a ${contractType}!`);
            return;
            
        } catch (error) {
            console.log(`   ❌ Not a ${contractType}: ${error.message}`);
        }
    }
    
    console.log("\n❌ Could not determine contract type");
    console.log("💡 This might be a different type of contract or have a different interface");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error("Script failed:", e);
        process.exit(1);
    });





