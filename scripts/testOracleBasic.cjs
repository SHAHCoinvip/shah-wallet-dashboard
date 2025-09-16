const hre = require("hardhat");

async function main() {
  console.log("🔮 Testing Basic Oracle Functionality...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Oracle address from recent deployment
  const ORACLE_ADDRESS = "0x2830c9fd75f5de0437F2E70da9136a87293b8eB0";

  try {
    console.log("🔍 Checking if Oracle contract exists...");
    const code = await hre.ethers.provider.getCode(ORACLE_ADDRESS);
    
    if (code === "0x") {
      console.log("❌ No contract at Oracle address");
      return;
    }
    
    console.log(`✅ Contract exists (${code.length / 2 - 1} bytes)`);
    console.log("");

    // Try to get basic properties
    console.log("🔍 Testing basic property reads...");
    
    try {
      const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
      
      // Try to read factory address
      try {
        const factory = await oracle.factory();
        console.log(`✅ Factory: ${factory}`);
      } catch (error) {
        console.log(`❌ Could not read factory: ${error.message}`);
      }
      
      // Try to read WETH address
      try {
        const weth = await oracle.WETH();
        console.log(`✅ WETH: ${weth}`);
      } catch (error) {
        console.log(`❌ Could not read WETH: ${error.message}`);
      }
      
      // Try to read minimum liquidity
      try {
        const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
        console.log(`✅ Min Liquidity: ${hre.ethers.formatEther(minLiquidity)} tokens`);
      } catch (error) {
        console.log(`❌ Could not read min liquidity: ${error.message}`);
      }
      
      // Try to read owner
      try {
        const owner = await oracle.owner();
        console.log(`✅ Owner: ${owner}`);
      } catch (error) {
        console.log(`❌ Could not read owner: ${error.message}`);
      }
      
    } catch (error) {
      console.log(`❌ Could not create Oracle contract instance: ${error.message}`);
    }

    // Try to call getPair directly on the factory
    console.log("\n🔍 Testing factory getPair function...");
    try {
      const factoryAddress = "0xACE01a21334a1A9e8EADbf5C19b8dC1DE28f3589";
      const factory = await hre.ethers.getContractAt("ShahSwapFactory", factoryAddress);
      
      const SHAH = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
      const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      
      const pairAddress = await factory.getPair(SHAH, WETH);
      console.log(`✅ Factory getPair(SHAH, WETH): ${pairAddress}`);
      
      if (pairAddress !== "0x0000000000000000000000000000000000000000") {
        console.log("✅ Pair exists in factory");
      } else {
        console.log("❌ Pair does not exist in factory");
      }
      
    } catch (error) {
      console.log(`❌ Factory test failed: ${error.message}`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

