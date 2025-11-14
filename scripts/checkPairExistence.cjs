const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking Pair Contract Existence...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // LP Pair addresses
  const PAIRS = [
    {
      name: "SHAH/ETH",
      pair: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH
    },
    {
      name: "SHAH/USDT", 
      pair: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7"  // USDT
    },
    {
      name: "SHAH/DAI",
      pair: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048", 
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F"  // DAI
    }
  ];

  try {
    for (const pairInfo of PAIRS) {
      console.log(`🔍 Checking ${pairInfo.name}...`);
      
      try {
        // Check if address has code
        const code = await hre.ethers.provider.getCode(pairInfo.pair);
        
        if (code === "0x") {
          console.log(`   ❌ No contract at address ${pairInfo.pair}`);
          continue;
        }
        
        console.log(`   ✅ Contract exists at address`);
        console.log(`   📏 Contract size: ${code.length / 2 - 1} bytes`);
        
        // Try to get basic info
        try {
          const pair = await hre.ethers.getContractAt("IShahSwapPair", pairInfo.pair);
          
          // Try to get token addresses
          try {
            const token0 = await pair.token0();
            const token1 = await pair.token1();
            console.log(`   🪙 Token0: ${token0}`);
            console.log(`   🪙 Token1: ${token1}`);
            
            // Check if tokens match expected
            if (token0.toLowerCase() === pairInfo.token0.toLowerCase() && 
                token1.toLowerCase() === pairInfo.token1.toLowerCase()) {
              console.log(`   ✅ Token addresses match expected`);
            } else {
              console.log(`   ❌ Token addresses don't match expected`);
            }
          } catch (error) {
            console.log(`   ⚠️  Could not get token addresses: ${error.message}`);
          }
          
          // Try to get reserves
          try {
            const reserves = await pair.getReserves();
            console.log(`   💧 Reserves: ${hre.ethers.formatEther(reserves[0])} / ${hre.ethers.formatEther(reserves[1])}`);
          } catch (error) {
            console.log(`   ⚠️  Could not get reserves: ${error.message}`);
          }
          
          // Try to get total supply
          try {
            const totalSupply = await pair.totalSupply();
            console.log(`   📊 Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
          } catch (error) {
            console.log(`   ⚠️  Could not get total supply: ${error.message}`);
          }
          
        } catch (error) {
          console.log(`   ⚠️  Could not interact as IShahSwapPair: ${error.message}`);
          
          // Try to call getReserves directly
          try {
            const data = await hre.ethers.provider.call({
              to: pairInfo.pair,
              data: "0x0902f1ac" // getReserves() function selector
            });
            
            if (data && data !== "0x") {
              console.log(`   💧 Raw reserves data: ${data}`);
              // Try to decode
              try {
                const decoded = hre.ethers.AbiCoder.defaultAbiCoder().decode(
                  ["uint112", "uint112", "uint32"],
                  data
                );
                console.log(`   📊 Decoded reserves: ${decoded[0]}, ${decoded[1]}, ${decoded[2]}`);
              } catch (decodeError) {
                console.log(`   ⚠️  Could not decode reserves: ${decodeError.message}`);
              }
            } else {
              console.log(`   ❌ getReserves() returned empty data`);
            }
          } catch (callError) {
            console.log(`   ❌ Could not call getReserves(): ${callError.message}`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error checking pair: ${error.message}`);
      }
      
      console.log("");
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





