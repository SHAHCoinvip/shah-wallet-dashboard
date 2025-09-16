const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking BatchExecutor deployment status...");
  
  try {
    // Check if we have a deployment address in environment
    const envAddress = process.env.BATCH_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS;
    
    if (envAddress) {
      console.log("📋 Found deployment address in environment:", envAddress);
      
      // Try to connect to the contract
      const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
      const batchExecutor = BatchExecutor.attach(envAddress);
      
      // Test basic functionality
      const maxTx = await batchExecutor.maxTransactionsPerBatch();
      const fee = await batchExecutor.executionFee();
      const owner = await batchExecutor.owner();
      
      console.log("✅ Contract is deployed and working:");
      console.log(`   Max transactions per batch: ${maxTx}`);
      console.log(`   Execution fee: ${hre.ethers.formatEther(fee)} ETH`);
      console.log(`   Owner: ${owner}`);
      
      return;
    }
    
    console.log("❌ No deployment address found in environment");
    console.log("💡 To deploy the contract, run:");
    console.log("   npx hardhat run scripts/deployBatchExecutor.js --network mainnet");
    
  } catch (error) {
    console.error("❌ Error checking deployment:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 