const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Getting BatchExecutor contract address...");
  
  try {
    // Check if we have a deployment address in environment
    const envAddress = process.env.BATCH_EXECUTOR_ADDRESS || process.env.NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS;
    
    if (envAddress && envAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("📋 Found deployment address in environment:", envAddress);
      
      try {
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
      } catch (error) {
        console.log("⚠️ Contract at address is not valid, deploying new one...");
      }
    }
    
    // If no address found, let's try to deploy
    console.log("🚀 No deployment address found. Deploying BatchExecutor...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
    
    if (balance < hre.ethers.parseEther("0.01")) {
      console.log("❌ Insufficient balance for deployment");
      return;
    }
    
    // Fee collector address (same as deployer for now)
    const feeCollector = deployer.address;
    console.log("📋 Fee Collector:", feeCollector);
    
    const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
    const batchExecutor = await BatchExecutor.deploy(feeCollector);
    
    console.log("⏳ Waiting for deployment...");
    await batchExecutor.waitForDeployment();
    
    const address = await batchExecutor.getAddress();
    console.log("✅ BatchExecutor deployed to:", address);
    
    // Update .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add or update the contract addresses
    const lines = envContent.split('\n');
    let foundBatchExecutor = false;
    let foundPublicBatchExecutor = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('BATCH_EXECUTOR_ADDRESS=')) {
        lines[i] = `BATCH_EXECUTOR_ADDRESS=${address}`;
        foundBatchExecutor = true;
      }
      if (lines[i].startsWith('NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=')) {
        lines[i] = `NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${address}`;
        foundPublicBatchExecutor = true;
      }
    }
    
    if (!foundBatchExecutor) {
      lines.push(`BATCH_EXECUTOR_ADDRESS=${address}`);
    }
    if (!foundPublicBatchExecutor) {
      lines.push(`NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${address}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log("✅ Updated .env.local with contract address");
    
    // Test the deployed contract
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
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 