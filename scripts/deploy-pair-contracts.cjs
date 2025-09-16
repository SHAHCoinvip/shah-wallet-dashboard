const { ethers } = require("hardhat");

async function main() {
    console.log("🏗️ Deploying Pair Contracts at Expected Addresses...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());

    // The pair addresses that the factory expects
    const expectedPairs = [
        {
            name: "SHAH/USDT",
            address: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
            tokenA: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
            tokenB: "0xdAC17F958D2ee523a2206206994597C13D831ec7"  // USDT
        },
        {
            name: "SHAH/DAI", 
            address: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
            tokenA: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
            tokenB: "0x6B175474E89094C44Da98b954EedeAC495271d0F"  // DAI
        },
        {
            name: "SHAH/ETH",
            address: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e", 
            tokenA: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
            tokenB: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"  // WETH
        }
    ];

    console.log("\n🔍 Current Status:");
    for (const pair of expectedPairs) {
        const code = await ethers.provider.getCode(pair.address);
        console.log(`  ${pair.name}: ${code === "0x" ? "❌ No contract" : "✅ Contract exists"}`);
    }

    console.log("\n🏗️ Deploying Pair Contracts...");

    try {
        // Get the ShahSwapPair contract factory
        const ShahSwapPair = await ethers.getContractFactory("ShahSwapPair");

        for (const pair of expectedPairs) {
            console.log(`\n🔄 Deploying ${pair.name} at ${pair.address}...`);
            
            // Check if contract already exists
            const existingCode = await ethers.provider.getCode(pair.address);
            if (existingCode !== "0x") {
                console.log("  ⚠️ Contract already exists, skipping...");
                continue;
            }

            try {
                // Deploy the pair contract
                const pairContract = await ShahSwapPair.deploy();
                await pairContract.waitForDeployment();
                const deployedAddress = await pairContract.getAddress();
                
                console.log("  ✅ Pair contract deployed at:", deployedAddress);
                
                // Initialize the pair
                console.log("  🔧 Initializing pair...");
                const initTx = await pairContract.initialize(pair.tokenA, pair.tokenB);
                await initTx.wait();
                console.log("  ✅ Pair initialized. Tx:", initTx.hash);
                
            } catch (error) {
                console.log("  ❌ Error deploying pair:", error.message);
            }
        }

        console.log("\n🔍 Final Status:");
        for (const pair of expectedPairs) {
            const code = await ethers.provider.getCode(pair.address);
            console.log(`  ${pair.name}: ${code === "0x" ? "❌ No contract" : "✅ Contract exists"}`);
        }

        console.log("\n🎉 Pair contract deployment completed!");
        console.log("📝 Next step: Run the liquidity addition script");

    } catch (error) {
        console.error("❌ Error deploying pair contracts:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
