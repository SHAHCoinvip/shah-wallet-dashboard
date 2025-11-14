const hre = require("hardhat");

async function main() {
  console.log("🔍 Listing All Pairs in ShahSwap Factory...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Factory address from the oracle
  const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";

  try {
    // Get factory contract
    const factory = await hre.ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);
    console.log(`🏭 Factory address: ${FACTORY_ADDRESS}`);
    
    // Get total pairs
    const totalPairs = await factory.allPairsLength();
    console.log(`📊 Total pairs in factory: ${totalPairs}\n`);
    
    if (totalPairs > 0) {
      console.log("🔍 Checking each pair...\n");
      
      for (let i = 0; i < totalPairs; i++) {
        try {
          // Get pair address by index
          const pairAddress = await factory.allPairs(i);
          console.log(`Pair ${i}: ${pairAddress}`);
          
          // Check if contract exists
          const code = await hre.ethers.provider.getCode(pairAddress);
          if (code !== "0x") {
            console.log(`   ✅ Contract exists (${code.length / 2 - 1} bytes)`);
            
            // Try to get basic info
            try {
              const pair = await hre.ethers.getContractAt("IShahSwapPair", pairAddress);
              
              // Get token addresses
              try {
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                console.log(`   🪙 Token0: ${token0}`);
                console.log(`   🪙 Token1: ${token1}`);
                
                // Get reserves
                try {
                  const reserves = await pair.getReserves();
                  const totalSupply = await pair.totalSupply();
                  console.log(`   💧 Reserves: ${hre.ethers.formatEther(reserves[0])} / ${hre.ethers.formatEther(reserves[1])}`);
                  console.log(`   📊 Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
                } catch (error) {
                  console.log(`   ⚠️  Could not get reserves: ${error.message}`);
                }
                
              } catch (error) {
                console.log(`   ⚠️  Could not get token addresses: ${error.message}`);
              }
              
            } catch (error) {
              console.log(`   ⚠️  Could not interact as pair: ${error.message}`);
            }
            
          } else {
            console.log(`   ❌ No contract deployed`);
          }
          
          console.log("");
          
        } catch (error) {
          console.log(`Pair ${i}: ❌ Error: ${error.message}\n`);
        }
      }
    } else {
      console.log("No pairs found in factory.");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





