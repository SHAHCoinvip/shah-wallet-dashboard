const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting BatchExecutor deployment...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance < hre.ethers.parseEther("0.01")) {
    console.log("❌ Insufficient balance for deployment");
    return;
  }
  
  // Fee collector address (same as deployer for now)
  const feeCollector = deployer.address;
  console.log("📋 Fee Collector:", feeCollector);
  
  try {
    console.log("🔨 Deploying BatchExecutor...");
    const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
    const batchExecutor = await BatchExecutor.deploy(feeCollector);
    
    console.log("⏳ Waiting for deployment...");
    await batchExecutor.waitForDeployment();
    
    const address = await batchExecutor.getAddress();
    console.log("✅ BatchExecutor deployed to:", address);
    
    // Test basic functionality
    console.log("🧪 Testing contract...");
    const maxTx = await batchExecutor.maxTransactionsPerBatch();
    const fee = await batchExecutor.executionFee();
    const owner = await batchExecutor.owner();
    
    console.log("✅ Contract initialized correctly:");
    console.log(`   Max transactions per batch: ${maxTx}`);
    console.log(`   Execution fee: ${hre.ethers.formatEther(fee)} ETH`);
    console.log(`   Owner: ${owner}`);
    
    // Try to verify on Etherscan
    console.log("🔍 Attempting Etherscan verification...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [feeCollector],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
    
    console.log("\n📝 Update your .env.local file with:");
    console.log(`NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${address}`);
    console.log(`BATCH_EXECUTOR_ADDRESS=${address}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 