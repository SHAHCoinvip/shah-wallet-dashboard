const hre = require("hardhat");

async function main() {
  console.log("🔮 Deploying New ShahSwap Oracle...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${signer.address}`);

  // Load deployment info
  const fs = require('fs');
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found. Please run deployShahSwapFactory.cjs first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  const newFactoryAddress = deploymentInfo.contracts.ShahSwapFactory;
  
  // Token addresses
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  
  console.log(`🏭 Factory Address: ${newFactoryAddress}`);
  console.log(`💧 WETH Address: ${WETH_ADDRESS}`);
  console.log("");

  try {
    // Deploy Oracle
    console.log("🔮 Deploying ShahSwapOracle...");
    const ShahSwapOracle = await hre.ethers.getContractFactory("ShahSwapOracle");
    const oracle = await ShahSwapOracle.deploy(newFactoryAddress, WETH_ADDRESS);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    
    console.log(`✅ Oracle deployed to: ${oracleAddress}`);
    console.log(`🏭 Factory: ${newFactoryAddress}`);
    console.log(`💧 WETH: ${WETH_ADDRESS}`);
    console.log("");

    // Verify Oracle configuration
    console.log("🔍 Verifying Oracle configuration...");
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
    const pairs = deploymentInfo.contracts.pairs;
    
    for (const [pairName, pairAddress] of Object.entries(pairs)) {
      try {
        console.log(`Testing ${pairName}...`);
        
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

    // Save deployment info
    const oracleDeploymentInfo = {
      network: hre.network.name,
      deployer: signer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        ShahSwapOracle: oracleAddress,
        ShahSwapFactory: newFactoryAddress,
        pairs: pairs
      },
      tokens: deploymentInfo.tokens
    };

    fs.writeFileSync('shahswap-oracle-deployment.json', JSON.stringify(oracleDeploymentInfo, null, 2));
    console.log("💾 Oracle deployment info saved to: shahswap-oracle-deployment.json");

    // Summary
    console.log("\n📊 Oracle Deployment Summary:");
    console.log(`🔮 Oracle: ${oracleAddress}`);
    console.log(`🏭 Factory: ${newFactoryAddress}`);
    console.log(`👑 Owner: ${signer.address}`);
    console.log("");
    console.log("🔗 Pairs Status:");
    for (const [pairName, pairAddress] of Object.entries(pairs)) {
      try {
        const isSupported = await oracle.isPairSupported(pairAddress);
        console.log(`   ${pairName}: ${isSupported ? "✅ Supported" : "❌ Not Supported"}`);
      } catch (error) {
        console.log(`   ${pairName}: ❌ Error checking`);
      }
    }

    // Instructions for next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Verify Oracle on Etherscan");
    console.log("2. Update .env.local with new Oracle address");
    console.log("3. Add initial liquidity to pairs");
    console.log("4. Test farming system with new LP tokens");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
