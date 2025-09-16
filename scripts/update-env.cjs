const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Finding deployed BatchExecutor contract...");
  
  try {
    // Get the deployer address from the screenshot
    const deployerAddress = "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4";
    
    // Get the latest transaction from this address to find the contract
    const provider = hre.ethers.provider;
    const latestBlock = await provider.getBlockNumber();
    
    console.log("🔍 Searching for contract deployment...");
    
    // Look for contract creation in recent blocks
    for (let i = 0; i < 10; i++) {
      const block = await provider.getBlock(latestBlock - i, true);
      if (block && block.transactions) {
        for (const tx of block.transactions) {
          if (tx.from.toLowerCase() === deployerAddress.toLowerCase() && tx.to === null) {
            // This is a contract creation transaction
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt && receipt.contractAddress) {
              console.log("✅ Found deployed contract address:", receipt.contractAddress);
              
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
                  lines[i] = `BATCH_EXECUTOR_ADDRESS=${receipt.contractAddress}`;
                  foundBatchExecutor = true;
                }
                if (lines[i].startsWith('NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=')) {
                  lines[i] = `NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${receipt.contractAddress}`;
                  foundPublicBatchExecutor = true;
                }
              }
              
              if (!foundBatchExecutor) {
                lines.push(`BATCH_EXECUTOR_ADDRESS=${receipt.contractAddress}`);
              }
              if (!foundPublicBatchExecutor) {
                lines.push(`NEXT_PUBLIC_BATCH_EXECUTOR_ADDRESS=${receipt.contractAddress}`);
              }
              
              fs.writeFileSync(envPath, lines.join('\n'));
              console.log("✅ Updated .env.local with contract address");
              
              // Test the contract
              try {
                const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
                const batchExecutor = BatchExecutor.attach(receipt.contractAddress);
                
                const maxTx = await batchExecutor.maxTransactionsPerBatch();
                const fee = await batchExecutor.executionFee();
                const owner = await batchExecutor.owner();
                
                console.log("✅ Contract is working:");
                console.log(`   Max transactions per batch: ${maxTx}`);
                console.log(`   Execution fee: ${hre.ethers.formatEther(fee)} ETH`);
                console.log(`   Owner: ${owner}`);
                
                return;
              } catch (error) {
                console.log("⚠️ Could not test contract:", error.message);
              }
              
              return;
            }
          }
        }
      }
    }
    
    console.log("❌ Could not find deployed contract automatically");
    console.log("💡 Please manually add the contract address to .env.local");
    
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