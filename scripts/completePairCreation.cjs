const hre = require("hardhat");

async function main() {
  console.log("🔧 Completing Pair Creation...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Load deployment info
  const fs = require('fs');
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  const factoryAddress = deploymentInfo.contracts.ShahSwapFactory;
  
  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`🔗 Existing pairs: ${Object.keys(deploymentInfo.contracts.pairs).length}`);
  console.log("");

  try {
    const factory = await hre.ethers.getContractAt("ShahSwapFactory", factoryAddress);
    
    // Check which pairs exist
    const TOKENS = deploymentInfo.tokens;
    const PAIRS = [
      { name: "SHAH/ETH", token0: TOKENS.SHAH, token1: TOKENS.WETH },
      { name: "SHAH/USDT", token0: TOKENS.SHAH, token1: TOKENS.USDT },
      { name: "SHAH/DAI", token0: TOKENS.SHAH, token1: TOKENS.DAI }
    ];

    console.log("🔍 Checking pair status...");
    for (const pairInfo of PAIRS) {
      try {
        const pairAddress = await factory.getPair(pairInfo.token0, pairInfo.token1);
        
        if (pairAddress !== "0x0000000000000000000000000000000000000000") {
          console.log(`✅ ${pairInfo.name}: ${pairAddress}`);
          
                     // Check if pair contract is properly initialized
           try {
             const pair = await hre.ethers.getContractAt("ShahSwapPair", pairAddress);
            const token0 = await pair.token0();
            const token1 = await pair.token1();
            const factoryAddr = await pair.factory();
            
            console.log(`   🪙 Token0: ${token0}`);
            console.log(`   🪙 Token1: ${token1}`);
            console.log(`   🏭 Factory: ${factoryAddr}`);
            
            if (factoryAddr === factoryAddress) {
              console.log(`   ✅ Factory reference correct`);
            } else {
              console.log(`   ❌ Factory reference mismatch`);
            }
            
          } catch (error) {
            console.log(`   ⚠️  Pair contract issue: ${error.message}`);
          }
          
        } else {
          console.log(`❌ ${pairInfo.name}: Not created`);
          
          // Try to create it
          try {
            console.log(`   🚀 Creating ${pairInfo.name}...`);
            const tx = await factory.createPair(pairInfo.token0, pairInfo.token1);
            const receipt = await tx.wait();
            
            // Get the pair address from the event
            const pairCreatedEvent = receipt.logs.find(log => {
              try {
                const parsed = factory.interface.parseLog(log);
                return parsed.name === 'PairCreated';
              } catch {
                return false;
              }
            });

            if (pairCreatedEvent) {
              const parsed = factory.interface.parseLog(pairCreatedEvent);
              const newPairAddress = parsed.args.pair;
              console.log(`   ✅ Created at: ${newPairAddress}`);
              
              // Update deployment info
              deploymentInfo.contracts.pairs[pairInfo.name] = newPairAddress;
              
            } else {
              console.log(`   ❌ Could not find PairCreated event`);
            }
            
          } catch (error) {
            console.log(`   ❌ Creation failed: ${error.message}`);
          }
        }
        
        console.log("");
        
      } catch (error) {
        console.log(`❌ Error checking ${pairInfo.name}: ${error.message}`);
      }
    }

    // Save updated deployment info
    fs.writeFileSync('shahswap-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Updated deployment info saved");

    // Summary
    console.log("\n📊 Final Summary:");
    console.log(`🏭 Factory: ${factoryAddress}`);
    console.log(`🔗 Total pairs: ${Object.keys(deploymentInfo.contracts.pairs).length}`);
    console.log("");
    console.log("🔗 Pairs:");
    Object.entries(deploymentInfo.contracts.pairs).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

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
