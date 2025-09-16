const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ShahSwap Factory & Pairs...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${signer.address}`);

  // Token addresses
  const TOKENS = {
    SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  };

  // Pairs to create
  const PAIRS = [
    { name: "SHAH/ETH", token0: TOKENS.SHAH, token1: TOKENS.WETH },
    { name: "SHAH/USDT", token0: TOKENS.SHAH, token1: TOKENS.USDT },
    { name: "SHAH/DAI", token0: TOKENS.SHAH, token1: TOKENS.DAI }
  ];

  try {
    console.log("📋 Token Addresses:");
    Object.entries(TOKENS).forEach(([symbol, address]) => {
      console.log(`   ${symbol}: ${address}`);
    });
    console.log("");

    // Deploy Factory
    console.log("🏭 Deploying ShahSwapFactory...");
    const ShahSwapFactory = await hre.ethers.getContractFactory("ShahSwapFactory");
    const factory = await ShahSwapFactory.deploy(signer.address);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    
    console.log(`✅ Factory deployed to: ${factoryAddress}`);
    console.log(`👑 FeeToSetter: ${signer.address}`);
    console.log("");

    // Create pairs
    console.log("🔗 Creating pairs...");
    const pairAddresses = {};

    for (const pairInfo of PAIRS) {
      try {
        console.log(`Creating ${pairInfo.name} pair...`);
        
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
          const pairAddress = parsed.args.pair;
          pairAddresses[pairInfo.name] = pairAddress;
          
          console.log(`   ✅ ${pairInfo.name} created at: ${pairAddress}`);
          
                     // Verify the pair was created correctly
           const pairContract = await hre.ethers.getContractAt("ShahSwapPair", pairAddress);
          const token0 = await pairContract.token0();
          const token1 = await pairContract.token1();
          const factoryAddress = await pairContract.factory();
          
          console.log(`   🪙 Token0: ${token0}`);
          console.log(`   🪙 Token1: ${token1}`);
          console.log(`   🏭 Factory: ${factoryAddress}`);
          
        } else {
          console.log(`   ❌ Could not find PairCreated event for ${pairInfo.name}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to create ${pairInfo.name}: ${error.message}`);
      }
      console.log("");
    }

    // Summary
    console.log("📊 Deployment Summary:");
    console.log(`🏭 Factory: ${factoryAddress}`);
    console.log(`👑 Owner: ${signer.address}`);
    console.log(`💰 FeeToSetter: ${signer.address}`);
    console.log("");
    console.log("🔗 Pairs Created:");
    Object.entries(pairAddresses).forEach(([name, address]) => {
      console.log(`   ${name}: ${address}`);
    });

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      deployer: signer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        ShahSwapFactory: factoryAddress,
        pairs: pairAddresses
      },
      tokens: TOKENS
    };

    const fs = require('fs');
    fs.writeFileSync('shahswap-deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to: shahswap-deployment.json");

    // Instructions for next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Verify contracts on Etherscan");
    console.log("2. Update .env.local with new factory address");
    console.log("3. Register pairs with the Oracle");
    console.log("4. Add initial liquidity to pairs");

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
