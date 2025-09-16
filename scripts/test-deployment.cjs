const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing BatchExecutor deployment...");
  
  try {
    // First, let's check if we can compile
    console.log("🔨 Compiling contracts...");
    await hre.run("compile");
    console.log("✅ Compilation successful");
    
    // Check if we have the contract factory
    const BatchExecutor = await hre.ethers.getContractFactory("BatchExecutor");
    console.log("✅ Contract factory loaded");
    
    // Check deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📋 Deployer address:", deployer.address);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");
    
    if (balance < hre.ethers.parseEther("0.01")) {
      console.log("❌ Insufficient balance for deployment");
      return;
    }
    
    console.log("✅ Ready for deployment");
    console.log("💡 Run: npx hardhat run scripts/deployBatchExecutor.cjs --network mainnet");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 