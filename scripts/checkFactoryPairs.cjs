const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking ShahSwap Factory for Existing Pairs...\n");

  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Current signer: ${signer.address}`);

  // Factory address from the oracle
  const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
  
  // SHAH token address
  const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
  
  // Common token addresses
  const TOKENS = [
    { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F" },
    { symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    { symbol: "MATIC", address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0" },
    { symbol: "ARB", address: "0x912CE59144191C1204E64559FE8253a0e49E6548" },
    { symbol: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" }
  ];

  try {
    // Get factory contract
    const factory = await hre.ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);
    console.log(`🏭 Factory address: ${FACTORY_ADDRESS}`);
    
    // Get factory owner
    try {
      const owner = await factory.owner();
      console.log(`👑 Factory owner: ${owner}`);
    } catch (error) {
      console.log(`⚠️  Could not get factory owner: ${error.message}`);
    }
    
    // Get total pairs
    try {
      const totalPairs = await factory.allPairsLength();
      console.log(`📊 Total pairs in factory: ${totalPairs}`);
    } catch (error) {
      console.log(`⚠️  Could not get total pairs: ${error.message}`);
    }
    
    console.log("\n🔍 Checking for SHAH pairs...");
    
    // Check each token for SHAH pairs
    for (const token of TOKENS) {
      try {
        // Check if pair exists
        const pairAddress = await factory.getPair(SHAH_ADDRESS, token.address);
        
        if (pairAddress !== "0x0000000000000000000000000000000000000000") {
          console.log(`\n✅ Found SHAH/${token.symbol} pair:`);
          console.log(`   🪙 Token0: ${SHAH_ADDRESS} (SHAH)`);
          console.log(`   🪙 Token1: ${token.address} (${token.symbol})`);
          console.log(`   🔗 Pair address: ${pairAddress}`);
          
          // Check if pair contract exists
          const code = await hre.ethers.provider.getCode(pairAddress);
          if (code !== "0x") {
            console.log(`   📏 Contract size: ${code.length / 2 - 1} bytes`);
            
            // Try to get reserves
            try {
              const pair = await hre.ethers.getContractAt("IShahSwapPair", pairAddress);
              const reserves = await pair.getReserves();
              const totalSupply = await pair.totalSupply();
              
              console.log(`   💧 Reserves: ${hre.ethers.formatEther(reserves[0])} SHAH / ${hre.ethers.formatEther(reserves[1])} ${token.symbol}`);
              console.log(`   📊 Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
              
              // Check if it meets minimum liquidity
              const minLiquidity = hre.ethers.parseUnits("0.000000000000001", 18);
              if (reserves[0] >= minLiquidity && reserves[1] >= minLiquidity) {
                console.log(`   ✅ Meets minimum liquidity requirement`);
              } else {
                console.log(`   ❌ Does NOT meet minimum liquidity requirement`);
              }
              
            } catch (error) {
              console.log(`   ⚠️  Could not get pair details: ${error.message}`);
            }
          } else {
            console.log(`   ❌ No contract at pair address`);
          }
        } else {
          console.log(`❌ No SHAH/${token.symbol} pair found`);
        }
      } catch (error) {
        console.log(`⚠️  Error checking SHAH/${token.symbol}: ${error.message}`);
      }
    }
    
    // Also check reverse order (token/SHAH)
    console.log("\n🔍 Checking for reverse SHAH pairs...");
    for (const token of TOKENS) {
      try {
        const pairAddress = await factory.getPair(token.address, SHAH_ADDRESS);
        
        if (pairAddress !== "0x0000000000000000000000000000000000000000") {
          console.log(`\n✅ Found ${token.symbol}/SHAH pair:`);
          console.log(`   🪙 Token0: ${token.address} (${token.symbol})`);
          console.log(`   🪙 Token1: ${SHAH_ADDRESS} (SHAH)`);
          console.log(`   🔗 Pair address: ${pairAddress}`);
          
          // Check if pair contract exists
          const code = await hre.ethers.provider.getCode(pairAddress);
          if (code !== "0x") {
            console.log(`   📏 Contract size: ${code.length / 2 - 1} bytes`);
            
            // Try to get reserves
            try {
              const pair = await hre.ethers.getContractAt("IShahSwapPair", pairAddress);
              const reserves = await pair.getReserves();
              const totalSupply = await pair.totalSupply();
              
              console.log(`   💧 Reserves: ${hre.ethers.formatEther(reserves[0])} ${token.symbol} / ${hre.ethers.formatEther(reserves[1])} SHAH`);
              console.log(`   📊 Total LP supply: ${hre.ethers.formatEther(totalSupply)}`);
              
              // Check if it meets minimum liquidity
              const minLiquidity = hre.ethers.parseUnits("0.000000000000001", 18);
              if (reserves[0] >= minLiquidity && reserves[1] >= minLiquidity) {
                console.log(`   ✅ Meets minimum liquidity requirement`);
              } else {
                console.log(`   ❌ Does NOT meet minimum liquidity requirement`);
              }
              
            } catch (error) {
              console.log(`   ⚠️  Could not get pair details: ${error.message}`);
            }
          } else {
            console.log(`   ❌ No contract at pair address`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Error checking ${token.symbol}/SHAH: ${error.message}`);
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

