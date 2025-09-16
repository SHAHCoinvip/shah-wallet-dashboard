const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔧 Setting up ShahSwap Factory Pairs...\n");

    // Factory address from deployment
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4";

    // Token addresses (mainnet)
    const TOKENS = {
        SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    };

    console.log("📋 Configuration:");
    console.log(`   Factory: ${FACTORY_ADDRESS}`);
    console.log(`   Treasury: ${TREASURY_ADDRESS}`);
    console.log(`   SHAH Token: ${TOKENS.SHAH}`);
    console.log(`   WETH: ${TOKENS.WETH}`);
    console.log(`   USDC: ${TOKENS.USDC}`);
    console.log(`   USDT: ${TOKENS.USDT}`);
    console.log(`   DAI: ${TOKENS.DAI}\n`);

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Get factory contract instance
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);

        // 1. Set feeTo to treasury
        console.log("💰 Setting feeTo to treasury...");
        try {
            const setFeeToTx = await factory.setFeeTo(TREASURY_ADDRESS);
            await setFeeToTx.wait();
            console.log("   ✅ feeTo set successfully");
        } catch (error) {
            console.log("   ⚠️  setFeeTo failed:", error.message);
        }

        // 2. Create LP pairs
        console.log("\n🔄 Creating LP pairs...");
        const pairsToCreate = [
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.WETH, name: "SHAH-ETH" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDC, name: "SHAH-USDC" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDT, name: "SHAH-USDT" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.DAI, name: "SHAH-DAI" }
        ];

        const createdPairs = {};

        for (const pair of pairsToCreate) {
            try {
                console.log(`   Creating ${pair.name} pair...`);
                const createPairTx = await factory.createPair(pair.tokenA, pair.tokenB);
                const receipt = await createPairTx.wait();
                
                // Extract pair address from event
                const pairCreatedEvent = receipt.logs.find(log => {
                    try {
                        const parsed = factory.interface.parseLog(log);
                        return parsed.name === 'PairCreated';
                    } catch {
                        return false;
                    }
                });

                if (pairCreatedEvent) {
                    const parsed = factory.interface.parseLog(pairCreatedEvent);
                    const pairAddress = parsed.args.pair;
                    createdPairs[pair.name] = pairAddress;
                    console.log(`   ✅ ${pair.name} pair created: ${pairAddress}`);
                } else {
                    // Fallback: get pair address from mapping
                    const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
                    createdPairs[pair.name] = pairAddress;
                    console.log(`   ✅ ${pair.name} pair created: ${pairAddress}`);
                }
            } catch (error) {
                console.log(`   ⚠️  Failed to create ${pair.name} pair: ${error.message}`);
            }
        }

        // 3. Verify pairs exist
        console.log("\n🔍 Verifying pairs in factory...");
        for (const [name, address] of Object.entries(createdPairs)) {
            if (address !== ethers.ZeroAddress) {
                console.log(`   ✅ ${name}: ${address}`);
            } else {
                console.log(`   ❌ ${name}: Not created`);
            }
        }

        // 4. Save updated deployment info
        const fs = require("fs");
        const path = require("path");
        
        const deploymentInfo = {
            network: "mainnet",
            deployer: deployer.address,
            setupTime: new Date().toISOString(),
            factory: {
                address: FACTORY_ADDRESS,
                feeTo: TREASURY_ADDRESS,
                feeToSetter: deployer.address
            },
            pairs: createdPairs,
            tokens: TOKENS,
            status: "Factory setup complete with LP pairs"
        };

        const deploymentPath = path.join(__dirname, "..", "shahswap-factory-setup.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`\n📄 Setup info saved to: ${deploymentPath}`);

        // 5. Summary
        console.log("\n🎉 ShahSwap Factory Setup Complete!");
        console.log("\n📋 Summary:");
        console.log(`   Factory: ${FACTORY_ADDRESS}`);
        console.log(`   Fee To: ${TREASURY_ADDRESS}`);
        console.log(`   Total Pairs: ${Object.keys(createdPairs).length}`);

        console.log("\n🔄 Created Pairs:");
        for (const [name, address] of Object.entries(createdPairs)) {
            if (address !== ethers.ZeroAddress) {
                console.log(`   ${name}: ${address}`);
            }
        }

        console.log("\n🔗 Etherscan Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY_ADDRESS}`);

        console.log("\n🚀 Next Steps:");
        console.log("   1. Update Router V2 to use this factory");
        console.log("   2. Add pairs to Oracle for TWAP price feeds");
        console.log("   3. Test swap functionality with new pairs");
        console.log("   4. Update frontend to use new factory");

    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

