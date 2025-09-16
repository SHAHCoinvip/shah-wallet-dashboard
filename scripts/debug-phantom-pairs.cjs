const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging Phantom Pairs...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());

    // The pair addresses you provided
    const pairAddresses = {
        "SHAH-ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
        "SHAH-USDC": "0x6f31E71925572E51c38c468188aAE117c993f6F8", 
        "SHAH-USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
        "SHAH-DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048"
    };

    console.log("\n🔍 Checking Provided Pair Addresses:");
    
    for (const [name, address] of Object.entries(pairAddresses)) {
        console.log(`\n📊 ${name}:`);
        console.log("  Address:", address);
        
        // Check if contract exists at that address
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
            console.log("  Status: ❌ No contract deployed");
        } else {
            console.log("  Status: ✅ Contract exists");
            console.log("  Code length:", code.length, "bytes");
            
            // Try to interact with the contract
            try {
                const pairContract = await ethers.getContractAt("contracts/interfaces/IShahSwapPair.sol:IShahSwapPair", address);
                
                // Try to get basic info
                try {
                    const token0 = await pairContract.token0();
                    const token1 = await pairContract.token1();
                    console.log("  Token0:", token0);
                    console.log("  Token1:", token1);
                } catch (error) {
                    console.log("  Token info: ❌ Error:", error.message);
                }
                
                // Try to get reserves
                try {
                    const reserves = await pairContract.getReserves();
                    console.log("  Reserves:", ethers.formatEther(reserves[0]), "token0,", ethers.formatEther(reserves[1]), "token1");
                } catch (error) {
                    console.log("  Reserves: ❌ Error:", error.message);
                }
                
            } catch (error) {
                console.log("  Contract interaction: ❌ Error:", error.message);
            }
        }
    }

    // Check if these addresses match what the factory returns
    console.log("\n🔍 Comparing with Factory:");
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);
    
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    const factoryPairs = [
        { name: "SHAH/USDT", tokenA: SHAH_ADDRESS, tokenB: USDT_ADDRESS },
        { name: "SHAH/DAI", tokenA: SHAH_ADDRESS, tokenB: DAI_ADDRESS },
        { name: "SHAH/ETH", tokenA: SHAH_ADDRESS, tokenB: WETH_ADDRESS }
    ];

    for (const pair of factoryPairs) {
        const factoryAddress = await factory.getPair(pair.tokenA, pair.tokenB);
        console.log(`\n📊 ${pair.name}:`);
        console.log("  Factory returns:", factoryAddress);
        
        // Check if this matches any of the provided addresses
        const providedAddress = Object.values(pairAddresses).find(addr => addr.toLowerCase() === factoryAddress.toLowerCase());
        if (providedAddress) {
            console.log("  ✅ Matches provided address");
        } else {
            console.log("  ❌ Does not match provided addresses");
        }
    }

    console.log("\n🎉 Phantom pair debugging completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
