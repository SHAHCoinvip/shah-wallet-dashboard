const hre = require("hardhat");

async function main() {
  console.log("🔮 Testing Oracle Registration with New Pairs...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Load deployment info
  const fs = require('fs');
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  const newFactoryAddress = deploymentInfo.contracts.ShahSwapFactory;
  const pairs = deploymentInfo.contracts.pairs;
  
  console.log(`🏭 New Factory: ${newFactoryAddress}`);
  console.log(`🔗 Pairs to test: ${Object.keys(pairs).length}`);
  console.log("");

  // Oracle address
  const ORACLE_ADDRESS = "0x608475033ac2c8B779043FB6F9B53d0633C7c79a";

  try {
    // Get Oracle contract
    const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
    
    // Check Oracle status
    console.log("🔍 Checking Oracle status...");
    const oracleFactory = await oracle.factory();
    const oracleWETH = await oracle.WETH();
    const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
    
    console.log(`   🏭 Oracle Factory: ${oracleFactory}`);
    console.log(`   💧 Oracle WETH: ${oracleWETH}`);
    console.log(`   💰 Min Liquidity: ${hre.ethers.formatEther(minLiquidity)} tokens`);
    console.log("");
    
    if (oracleFactory !== newFactoryAddress) {
      console.log("⚠️  Oracle is configured with a different factory!");
      console.log(`   Expected: ${newFactoryAddress}`);
      console.log(`   Current: ${oracleFactory}`);
      console.log("");
      console.log("💡 You may need to deploy a new Oracle or update the existing one.");
      return;
    }
    
    console.log("✅ Oracle is configured with the correct factory!");
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
