const { ethers } = require("hardhat");

async function main() {
    console.log("🏭 Creating Pairs First, Then Adding Liquidity...");

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

    console.log("\n🔍 Current Pair Status:");
    
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
        
        // Check if contract exists at that address
        const code = await ethers.provider.getCode(pairAddress);
        if (code === "0x") {
            console.log("  Status: ❌ Phantom pair (no contract deployed)");
            console.log("  Action: Need to create pair contract");
        } else {
            console.log("  Status: ✅ Contract exists");
            console.log("  Code length:", code.length, "bytes");
        }
    }

    console.log("\n🏗️ Creating Pair Contracts...");

    try {
        // Create SHAH/USDT pair
        console.log("\n🔄 Creating SHAH/USDT pair...");
        const createUsdtPairTx = await factory.createPair(SHAH_ADDRESS, USDT_ADDRESS);
        await createUsdtPairTx.wait();
        console.log("  ✅ SHAH/USDT pair created. Tx:", createUsdtPairTx.hash);

        // Create SHAH/DAI pair
        console.log("\n🔄 Creating SHAH/DAI pair...");
        const createDaiPairTx = await factory.createPair(SHAH_ADDRESS, DAI_ADDRESS);
        await createDaiPairTx.wait();
        console.log("  ✅ SHAH/DAI pair created. Tx:", createDaiPairTx.hash);

        // Create SHAH/ETH pair
        console.log("\n🔄 Creating SHAH/ETH pair...");
        const createEthPairTx = await factory.createPair(SHAH_ADDRESS, WETH_ADDRESS);
        await createEthPairTx.wait();
        console.log("  ✅ SHAH/ETH pair created. Tx:", createEthPairTx.hash);

        console.log("\n🔍 Verifying Pair Creation:");
        
        for (const pair of pairs) {
            console.log(`\n📊 ${pair.name}:`);
            
            // Get pair address from factory
            const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
            console.log("  Factory Address:", pairAddress);
            
            // Check if contract exists at that address
            const code = await ethers.provider.getCode(pairAddress);
            if (code === "0x") {
                console.log("  Status: ❌ Still phantom pair");
            } else {
                console.log("  Status: ✅ Contract now exists");
                console.log("  Code length:", code.length, "bytes");
                
                // Try to get reserves
                try {
                    const pairContract = await ethers.getContractAt("contracts/interfaces/IShahSwapPair.sol:IShahSwapPair", pairAddress);
                    const reserves = await pairContract.getReserves();
                    console.log("  Reserves:", ethers.formatEther(reserves[0]), "token0,", ethers.formatEther(reserves[1]), "token1");
                } catch (error) {
                    console.log("  Reserves: ⚠️ Error getting reserves:", error.message);
                }
            }
        }

        console.log("\n🎉 Pair creation completed!");
        console.log("📝 Next step: Run the liquidity addition script");

    } catch (error) {
        console.error("❌ Error creating pairs:", error);
        if (error.message.includes("PAIR_EXISTS")) {
            console.log("💡 Pairs already exist in factory, but contracts may not be deployed");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
