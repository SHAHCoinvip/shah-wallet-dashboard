const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking LP Pair Liquidity...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Oracle address
  const ORACLE_ADDRESS = "0x608475033ac2c8B779043FB6F9B53d0633C7c79a";
  
  // LP Pair addresses
  const PAIRS = [
    {
      name: "SHAH/ETH",
      pair: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH
    },
    {
      name: "SHAH/USDT", 
      pair: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7"  // USDT
    },
    {
      name: "SHAH/DAI",
      pair: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048", 
      token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
      token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F"  // DAI
    }
  ];

  try {
    // Get oracle contract
    const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS);
    
    // Get minimum liquidity requirement
    const minLiquidity = await oracle.MINIMUM_LIQUIDITY();
    console.log(`💰 Oracle minimum liquidity: ${hre.ethers.formatEther(minLiquidity)} tokens\n`);

    // Check each pair
    for (const pairInfo of PAIRS) {
      console.log(`🔍 Checking ${pairInfo.name}...`);
      
      try {
        // Get pair contract
        const pair = await hre.ethers.getContractAt("IShahSwapPair", pairInfo.pair);
        
        // Get reserves
        const reserves = await pair.getReserves();
        const token0Reserve = reserves[0];
        const token1Reserve = reserves[1];
        
        console.log(`   Token0 reserve: ${hre.ethers.formatEther(token0Reserve)}`);
        console.log(`   Token1 reserve: ${hre.ethers.formatEther(token1Reserve)}`);
        
        // Check if reserves meet minimum liquidity
        if (token0Reserve >= minLiquidity && token1Reserve >= minLiquidity) {
          console.log(`   ✅ Meets minimum liquidity requirement`);
        } else {
          console.log(`   ❌ Does NOT meet minimum liquidity requirement`);
        }
        
        // Get total supply
        const totalSupply = await pair.totalSupply();
        console.log(`   Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
        
        console.log("");
        
      } catch (error) {
        console.log(`   ❌ Error checking pair: ${error.message}`);
        console.log("");
      }
    }

    // Check if pairs are already registered
    console.log("🔍 Checking if pairs are already registered...");
    for (const pairInfo of PAIRS) {
      try {
        const isSupported = await oracle.isPairSupported(pairInfo.pair);
        console.log(`   ${pairInfo.name}: ${isSupported ? "✅ Registered" : "❌ Not registered"}`);
      } catch (error) {
        console.log(`   ${pairInfo.name}: ❌ Error checking: ${error.message}`);
      }
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

