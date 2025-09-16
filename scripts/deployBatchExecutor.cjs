const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying BatchExecutor with account:", deployer.address);
  console.log("💰 Account balance:", await hre.ethers.provider.getBalance(deployer.address));

  // Fee collector address (can be the deployer or a treasury address)
  const feeCollector = deployer.address; // Change this to your treasury address

  console.log("📋 Fee Collector:", feeCollector);

  const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
  const batchExecutor = await BatchExecutor.deploy(feeCollector);

  await batchExecutor.waitForDeployment();

  const address = await batchExecutor.getAddress();
  console.log("✅ BatchExecutor deployed to:", address);

  // Verify the contract on Etherscan
  console.log("🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [feeCollector],
    });
    console.log("✅ Contract verified on Etherscan");
  } catch (error) {
    console.log("⚠️ Verification failed:", error.message);
  }

  // Update environment variables
  console.log("\n📝 Update your .env.local file with:");
  console.log(`NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${address}`);
  console.log(`BATCH_EXECUTOR_ADDRESS=${address}`);

  // Test basic functionality
  console.log("\n🧪 Testing basic functionality...");
  try {
    const maxTx = await batchExecutor.maxTransactionsPerBatch();
    const fee = await batchExecutor.executionFee();
    const owner = await batchExecutor.owner();

    console.log("✅ Contract initialized correctly:");
    console.log(`   Max transactions per batch: ${maxTx}`);
    console.log(`   Execution fee: ${hre.ethers.formatEther(fee)} ETH`);
    console.log(`   Owner: ${owner}`);
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 