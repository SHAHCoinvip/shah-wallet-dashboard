const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Pair Status...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());

    // Contract addresses
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Get factory contract
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);

    console.log("\n🔍 Checking Pairs:");
    
    const pairs = [
        { name: "SHAH/USDT", tokenA: SHAH_ADDRESS, tokenB: USDT_ADDRESS },
        { name: "SHAH/DAI", tokenA: SHAH_ADDRESS, tokenB: DAI_ADDRESS },
        { name: "SHAH/ETH", tokenA: SHAH_ADDRESS, tokenB: WETH_ADDRESS }
    ];

    for (const pair of pairs) {
        console.log(`\n📊 ${pair.name}:`);
        
        // Get pair address from factory
        const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
        console.log("  Factory Address:", pairAddress);
        
        if (pairAddress === "0x0000000000000000000000000000000000000000") {
            console.log("  Status: ❌ Pair doesn't exist");
            continue;
        }
        
        // Check if contract exists at that address
        const code = await ethers.provider.getCode(pairAddress);
        if (code === "0x") {
            console.log("  Status: ❌ Phantom pair (no contract deployed)");
        } else {
            console.log("  Status: ✅ Contract exists");
            console.log("  Code length:", code.length, "bytes");
            
            // Try to get reserves
            try {
                const pairContract = await ethers.getContractAt("contracts/interfaces/IShahSwapPair.sol:IShahSwapPair", pairAddress);
                const reserves = await pairContract.getReserves();
                console.log("  Reserves:", ethers.formatEther(reserves[0]), "token0,", ethers.formatEther(reserves[1]), "token1");
                
                if (reserves[0] === 0n && reserves[1] === 0n) {
                    console.log("  Liquidity: ❌ No liquidity");
                } else {
                    console.log("  Liquidity: ✅ Has liquidity");
                }
            } catch (error) {
                console.log("  Reserves: ❌ Error getting reserves:", error.message);
            }
        }
    }

    console.log("\n🎉 Pair status check completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
