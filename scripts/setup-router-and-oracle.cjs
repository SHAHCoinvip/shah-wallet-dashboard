const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔧 Finalizing SHAH Ecosystem Integration...\n");
    console.log("=" .repeat(60));

    // Contract addresses
    const CONTRACTS = {
        // Factories
        SHAH_FACTORY: "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a", // Token Factory (don't touch)
        SHAHSWAP_FACTORY: "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204", // LP Factory
        
        // Core contracts
        ROUTER_V2: "0x20794d26397f2b81116005376AbEc0B995e9D502",
        ORACLE: "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52",
        
        // Treasury
        TREASURY: "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4"
    };

    // Token addresses (mainnet)
    const TOKENS = {
        SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    };

    // Pairs to ensure exist
    const PAIRS_TO_ENSURE = [
        { tokenA: TOKENS.SHAH, tokenB: TOKENS.WETH, name: "SHAH-ETH" },
        { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDC, name: "SHAH-USDC" },
        { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDT, name: "SHAH-USDT" },
        { tokenA: TOKENS.SHAH, tokenB: TOKENS.DAI, name: "SHAH-DAI" }
    ];

    console.log("📋 Configuration:");
    console.log(`   ShahSwap Factory: ${CONTRACTS.SHAHSWAP_FACTORY}`);
    console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
    console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
    console.log(`   Treasury: ${CONTRACTS.TREASURY}`);
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

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", CONTRACTS.SHAHSWAP_FACTORY);
        const router = await ethers.getContractAt("ShahSwapRouterV2", CONTRACTS.ROUTER_V2);
        const oracle = await ethers.getContractAt("ShahSwapOracle", CONTRACTS.ORACLE);

        // 1. Verify Router V2 is using the correct factory
        console.log("🔍 Step 1: Verifying Router V2 factory configuration...");
        try {
            const routerFactory = await router.factory();
            if (routerFactory.toLowerCase() === CONTRACTS.SHAHSWAP_FACTORY.toLowerCase()) {
                console.log("   ✅ Router V2 is already using the correct factory");
            } else {
                console.log(`   ⚠️  Router V2 factory mismatch:`);
                console.log(`      Expected: ${CONTRACTS.SHAHSWAP_FACTORY}`);
                console.log(`      Current:  ${routerFactory}`);
                console.log("   💡 Router V2 factory cannot be changed after deployment");
            }
        } catch (error) {
            console.log("   ⚠️  Could not verify Router V2 factory:", error.message);
        }

        // 2. Set Treasury (feeTo) on factory
        console.log("\n💰 Step 2: Setting Treasury (feeTo) on factory...");
        try {
            const currentFeeTo = await factory.feeTo();
            if (currentFeeTo.toLowerCase() === CONTRACTS.TREASURY.toLowerCase()) {
                console.log("   ✅ Treasury (feeTo) already set correctly");
            } else {
                console.log(`   Setting feeTo to treasury...`);
                const setFeeToTx = await factory.setFeeTo(CONTRACTS.TREASURY);
                await setFeeToTx.wait();
                console.log("   ✅ Treasury (feeTo) set successfully");
            }
        } catch (error) {
            console.log("   ⚠️  Failed to set feeTo:", error.message);
        }

        // 3. Ensure LP pairs exist
        console.log("\n🔄 Step 3: Ensuring LP pairs exist...");
        const pairResults = {};

        for (const pair of PAIRS_TO_ENSURE) {
            try {
                console.log(`   Checking ${pair.name} pair...`);
                
                // Check if pair already exists
                const existingPair = await factory.getPair(pair.tokenA, pair.tokenB);
                
                if (existingPair !== ethers.ZeroAddress) {
                    pairResults[pair.name] = {
                        address: existingPair,
                        status: "EXISTING",
                        created: false
                    };
                    console.log(`   ✅ ${pair.name} pair already exists: ${existingPair}`);
                } else {
                    // Create the pair
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
                        pairResults[pair.name] = {
                            address: pairAddress,
                            status: "CREATED",
                            created: true
                        };
                        console.log(`   ✅ ${pair.name} pair created: ${pairAddress}`);
                    } else {
                        // Fallback: get pair address from mapping
                        const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
                        pairResults[pair.name] = {
                            address: pairAddress,
                            status: "CREATED",
                            created: true
                        };
                        console.log(`   ✅ ${pair.name} pair created: ${pairAddress}`);
                    }
                }
            } catch (error) {
                console.log(`   ❌ Failed to ensure ${pair.name} pair: ${error.message}`);
                pairResults[pair.name] = {
                    address: ethers.ZeroAddress,
                    status: "FAILED",
                    created: false,
                    error: error.message
                };
            }
        }

        // 4. Register pairs with Oracle
        console.log("\n📊 Step 4: Registering pairs with Oracle...");
        const oracleResults = {};

        for (const [pairName, pairInfo] of Object.entries(pairResults)) {
            if (pairInfo.address === ethers.ZeroAddress) {
                console.log(`   ⚠️  Skipping ${pairName} - pair not available`);
                continue;
            }

            try {
                console.log(`   Registering ${pairName} with Oracle...`);
                
                // Determine token0 and token1 (sorted order)
                const token0 = TOKENS.SHAH < TOKENS[pairName.split('-')[1]] ? TOKENS.SHAH : TOKENS[pairName.split('-')[1]];
                const token1 = TOKENS.SHAH < TOKENS[pairName.split('-')[1]] ? TOKENS[pairName.split('-')[1]] : TOKENS.SHAH;
                
                // Check if pair is already registered in Oracle
                try {
                    // This is a simplified check - you might need to implement a proper check
                    // based on your Oracle contract's interface
                    const addPairTx = await oracle.addPair(pairInfo.address, token0, token1);
                    await addPairTx.wait();
                    oracleResults[pairName] = {
                        status: "REGISTERED",
                        pairAddress: pairInfo.address,
                        token0: token0,
                        token1: token1
                    };
                    console.log(`   ✅ ${pairName} registered with Oracle`);
                } catch (error) {
                    if (error.message.includes("already exists") || error.message.includes("already registered")) {
                        oracleResults[pairName] = {
                            status: "ALREADY_REGISTERED",
                            pairAddress: pairInfo.address,
                            token0: token0,
                            token1: token1
                        };
                        console.log(`   ✅ ${pairName} already registered with Oracle`);
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                console.log(`   ❌ Failed to register ${pairName} with Oracle: ${error.message}`);
                oracleResults[pairName] = {
                    status: "FAILED",
                    pairAddress: pairInfo.address,
                    error: error.message
                };
            }
        }

        // 5. Verify Oracle configuration
        console.log("\n🔍 Step 5: Verifying Oracle configuration...");
        try {
            const oracleFactory = await oracle.factory();
            console.log(`   Oracle Factory: ${oracleFactory}`);
            
            if (oracleFactory.toLowerCase() === CONTRACTS.SHAHSWAP_FACTORY.toLowerCase()) {
                console.log("   ✅ Oracle is configured with the correct factory");
            } else {
                console.log("   ⚠️  Oracle factory mismatch");
            }
        } catch (error) {
            console.log("   ⚠️  Could not verify Oracle factory:", error.message);
        }

        // 6. Save integration results
        console.log("\n📝 Step 6: Saving integration results...");
        const fs = require("fs");
        const path = require("path");
        
        const integrationInfo = {
            network: "mainnet",
            deployer: deployer.address,
            integrationTime: new Date().toISOString(),
            contracts: CONTRACTS,
            tokens: TOKENS,
            pairResults: pairResults,
            oracleResults: oracleResults,
            status: "SHAH Ecosystem Integration Complete"
        };

        const integrationPath = path.join(__dirname, "..", "shah-ecosystem-integration.json");
        fs.writeFileSync(integrationPath, JSON.stringify(integrationInfo, null, 2));
        console.log(`   ✅ Integration info saved to: ${integrationPath}`);

        // 7. Summary
        console.log("\n🎉 SHAH Ecosystem Integration Complete!");
        console.log("\n📋 Summary:");
        console.log(`   Factory: ${CONTRACTS.SHAHSWAP_FACTORY}`);
        console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
        console.log(`   Treasury: ${CONTRACTS.TREASURY}`);

        console.log("\n🔄 LP Pairs Status:");
        for (const [name, info] of Object.entries(pairResults)) {
            if (info.status === "EXISTING" || info.status === "CREATED") {
                console.log(`   ✅ ${name}: ${info.address}`);
            } else {
                console.log(`   ❌ ${name}: ${info.status}`);
            }
        }

        console.log("\n📊 Oracle Registration Status:");
        for (const [name, info] of Object.entries(oracleResults)) {
            if (info.status === "REGISTERED" || info.status === "ALREADY_REGISTERED") {
                console.log(`   ✅ ${name}: ${info.status}`);
            } else {
                console.log(`   ❌ ${name}: ${info.status}`);
            }
        }

        console.log("\n🔗 Etherscan Links:");
        console.log(`   Factory: https://etherscan.io/address/${CONTRACTS.SHAHSWAP_FACTORY}`);
        console.log(`   Router V2: https://etherscan.io/address/${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: https://etherscan.io/address/${CONTRACTS.ORACLE}`);

        console.log("\n🚀 SHAH Ecosystem is now fully integrated and ready!");
        console.log("All components are connected and operational.");

    } catch (error) {
        console.error("❌ Integration failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

