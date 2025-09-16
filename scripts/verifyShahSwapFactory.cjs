const hre = require("hardhat");

async function main() {
  console.log("🔍 Verifying ShahSwap Factory & Pairs on Etherscan...\n");

  // Check if deployment file exists
  const fs = require('fs');
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found. Please run deployShahSwapFactory.cjs first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  console.log(`📋 Network: ${deploymentInfo.network}`);
  console.log(`👤 Deployer: ${deploymentInfo.deployer}`);
  console.log(`🏭 Factory: ${deploymentInfo.contracts.ShahSwapFactory}`);
  console.log("");

  try {
    // Verify Factory
    console.log("🏭 Verifying ShahSwapFactory...");
    try {
      await hre.run("verify:verify", {
        address: deploymentInfo.contracts.ShahSwapFactory,
        constructorArguments: [deploymentInfo.deployer],
      });
      console.log("   ✅ Factory verified successfully");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("   ✅ Factory already verified");
      } else {
        console.log(`   ❌ Factory verification failed: ${error.message}`);
      }
    }

    // Verify Pairs
    console.log("\n🔗 Verifying pairs...");
    for (const [pairName, pairAddress] of Object.entries(deploymentInfo.contracts.pairs)) {
      try {
        console.log(`Verifying ${pairName}...`);
        
                 // Get pair contract to extract token addresses
         const pair = await hre.ethers.getContractAt("ShahSwapPair", pairAddress);
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        
        await hre.run("verify:verify", {
          address: pairAddress,
          constructorArguments: [],
        });
        console.log(`   ✅ ${pairName} verified successfully`);
        console.log(`   🪙 Token0: ${token0}`);
        console.log(`   🪙 Token1: ${token1}`);
        
      } catch (error) {
        if (error.message.includes("Already Verified")) {
          console.log(`   ✅ ${pairName} already verified`);
        } else {
          console.log(`   ❌ ${pairName} verification failed: ${error.message}`);
        }
      }
      console.log("");
    }

    console.log("🎉 Verification process completed!");
    console.log("\n📋 Etherscan Links:");
    console.log(`🏭 Factory: https://etherscan.io/address/${deploymentInfo.contracts.ShahSwapFactory}`);
    
    for (const [pairName, pairAddress] of Object.entries(deploymentInfo.contracts.pairs)) {
      console.log(`🔗 ${pairName}: https://etherscan.io/address/${pairAddress}`);
    }

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
