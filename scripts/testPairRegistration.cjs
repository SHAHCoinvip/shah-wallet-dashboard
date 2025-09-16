const hre = require("hardhat");

async function main() {
  console.log("🔗 Testing Pair Registration with Working Oracle...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Load deployment info
  const fs = require('fs');
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  const pairs = deploymentInfo.contracts.pairs;
  
  // Oracle address
  const ORACLE_ADDRESS = "0x2830c9fd75f5de0437F2E70da9136a87293b8eB0";
  
  console.log(`🔮 Oracle: ${ORACLE_ADDRESS}`);
  console.log(`🔗 Pairs to register: ${Object.keys(pairs).length}`);
  console.log("");

  try {
    // Get Oracle contract
    const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
    
    // Check Oracle status
    console.log("🔍 Oracle Status:");
    const oracleFactory = await oracle.factory();
    const oracleWETH = await oracle.WETH();
    const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
    const owner = await oracle.owner();
    
    console.log(`   🏭 Factory: ${oracleFactory}`);
    console.log(`   💧 WETH: ${oracleWETH}`);
    console.log(`   💰 Min Liquidity: ${hre.ethers.formatEther(minLiquidity)} tokens`);
    console.log(`   👑 Owner: ${owner}`);
    console.log("");

    // Test pair registration
    console.log("🔗 Testing pair registration...");
    for (const [pairName, pairAddress] of Object.entries(pairs)) {
      try {
        console.log(`Testing ${pairName}...`);
        
        // Check if pair is already registered
        const isSupported = await oracle.isPairSupported(pairAddress);
        if (isSupported) {
          console.log(`   ✅ ${pairName} is already registered`);
          continue;
        }
        
                 // Get pair contract to extract token addresses
         const pair = await hre.ethers.getContractAt("ShahSwapPair", pairAddress);
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        
        console.log(`   🪙 Token0: ${token0}`);
        console.log(`   🪙 Token1: ${token1}`);
        
        // Check pair liquidity
        const reserves = await pair.getReserves();
        const totalSupply = await pair.totalSupply();
        
        console.log(`   💧 Reserves: ${hre.ethers.formatEther(reserves[0])} / ${hre.ethers.formatEther(reserves[1])}`);
        console.log(`   📊 Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
        
        // Check if meets minimum liquidity
        if (reserves[0] >= minLiquidity && reserves[1] >= minLiquidity) {
          console.log(`   ✅ Meets minimum liquidity requirement`);
          
          // Try to register with Oracle
          try {
            console.log(`   🚀 Registering with Oracle...`);
            const tx = await oracle.addPair(pairAddress, token0, token1);
            const receipt = await tx.wait();
            
            console.log(`   ✅ Successfully registered! TX: ${receipt.hash}`);
            
            // Verify registration
            const isNowSupported = await oracle.isPairSupported(pairAddress);
            if (isNowSupported) {
              console.log(`   ✅ Pair is now supported by Oracle`);
            } else {
              console.log(`   ❌ Pair registration failed verification`);
            }
            
          } catch (error) {
            console.log(`   ❌ Oracle registration failed: ${error.message}`);
          }
          
        } else {
          console.log(`   ❌ Does NOT meet minimum liquidity requirement`);
          console.log(`   💡 Add some liquidity to this pair first`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error testing ${pairName}: ${error.message}`);
      }
      console.log("");
    }

    // Final Oracle status
    console.log("📊 Final Oracle Status:");
    for (const [pairName, pairAddress] of Object.entries(pairs)) {
      try {
        const isSupported = await oracle.isPairSupported(pairAddress);
        console.log(`   ${pairName}: ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
      } catch (error) {
        console.log(`   ${pairName}: ❌ Error checking`);
      }
    }

    // Summary
    console.log("\n📋 Summary:");
    console.log(`🔮 Oracle: ${ORACLE_ADDRESS}`);
    console.log(`🏭 Factory: ${oracleFactory}`);
    console.log(`👑 Owner: ${signer.address}`);
    console.log("");
    console.log("💡 Next Steps:");
    console.log("1. Add initial liquidity to pairs that don't meet requirements");
    console.log("2. Test farming system with new LP tokens");
    console.log("3. Update frontend to use new factory and Oracle");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
