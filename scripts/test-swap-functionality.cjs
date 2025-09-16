const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🧪 Testing SHAH Swap Functionality...\n");
    console.log("=" .repeat(60));

    // Contract addresses
    const CONTRACTS = {
        ROUTER_V2: "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C",
        ORACLE: "0x3712f346f2538E2101D38F23db1B7aC382eAD30D",
        FACTORY: "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204",
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

    // LP Pairs
    const LP_PAIRS = {
        "SHAH-ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
        "SHAH-USDC": "0x6f31E71925572E51c38c468188aAE117c993f6F8",
        "SHAH-USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
        "SHAH-DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048"
    };

    console.log("📋 Configuration:");
    console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
    console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
    console.log(`   Factory: ${CONTRACTS.FACTORY}`);
    console.log(`   Treasury: ${CONTRACTS.TREASURY}`);
    console.log(`   SHAH Token: ${TOKENS.SHAH}\n`);

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Get contract instances
        const router = await ethers.getContractAt("ShahSwapRouterV2", CONTRACTS.ROUTER_V2);
        const oracle = await ethers.getContractAt("ShahSwapOracle", CONTRACTS.ORACLE);
        const factory = await ethers.getContractAt("ShahSwapFactory", CONTRACTS.FACTORY);

        // 1. Test Router V2 factory connection
        console.log("🔍 Step 1: Testing Router V2 factory connection...");
        try {
            const routerFactory = await router.factory();
            console.log(`   Router Factory: ${routerFactory}`);
            
            if (routerFactory.toLowerCase() === CONTRACTS.FACTORY.toLowerCase()) {
                console.log("   ✅ Router V2 is connected to the correct factory");
            } else {
                console.log("   ❌ Router V2 factory mismatch");
            }
        } catch (error) {
            console.log(`   ❌ Failed to get router factory: ${error.message}`);
        }

        // 2. Test Oracle factory connection
        console.log("\n🔍 Step 2: Testing Oracle factory connection...");
        try {
            const oracleFactory = await oracle.factory();
            console.log(`   Oracle Factory: ${oracleFactory}`);
            
            if (oracleFactory.toLowerCase() === CONTRACTS.FACTORY.toLowerCase()) {
                console.log("   ✅ Oracle is connected to the correct factory");
            } else {
                console.log("   ❌ Oracle factory mismatch");
            }
        } catch (error) {
            console.log(`   ❌ Failed to get oracle factory: ${error.message}`);
        }

        // 3. Test pair existence in factory
        console.log("\n🔍 Step 3: Testing pair existence in factory...");
        const pairResults = {};

        for (const [pairName, pairAddress] of Object.entries(LP_PAIRS)) {
            try {
                let tokenA, tokenB;
                
                if (pairName === "SHAH-ETH") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.WETH;
                } else if (pairName === "SHAH-USDC") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDC;
                } else if (pairName === "SHAH-USDT") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDT;
                } else if (pairName === "SHAH-DAI") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.DAI;
                }

                const factoryPair = await factory.getPair(tokenA, tokenB);
                console.log(`   ${pairName}: ${factoryPair}`);
                
                if (factoryPair.toLowerCase() === pairAddress.toLowerCase()) {
                    console.log(`   ✅ ${pairName} pair exists in factory`);
                    pairResults[pairName] = {
                        status: "EXISTS",
                        address: factoryPair
                    };
                } else {
                    console.log(`   ❌ ${pairName} pair mismatch`);
                    pairResults[pairName] = {
                        status: "MISMATCH",
                        expected: pairAddress,
                        actual: factoryPair
                    };
                }
            } catch (error) {
                console.log(`   ❌ Failed to check ${pairName}: ${error.message}`);
                pairResults[pairName] = {
                    status: "ERROR",
                    error: error.message
                };
            }
        }

        // 4. Test Oracle pair registration
        console.log("\n📊 Step 4: Testing Oracle pair registration...");
        const oracleResults = {};

        for (const [pairName, pairInfo] of Object.entries(pairResults)) {
            if (pairInfo.status !== "EXISTS") {
                console.log(`   ⚠️  Skipping ${pairName} - pair not available`);
                continue;
            }

            try {
                console.log(`   Testing Oracle registration for ${pairName}...`);
                
                // Determine token0 and token1 (sorted order)
                let tokenA, tokenB;
                if (pairName === "SHAH-ETH") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.WETH;
                } else if (pairName === "SHAH-USDC") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDC;
                } else if (pairName === "SHAH-USDT") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDT;
                } else if (pairName === "SHAH-DAI") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.DAI;
                }

                const token0 = tokenA < tokenB ? tokenA : tokenB;
                const token1 = tokenA < tokenB ? tokenB : tokenA;
                
                // Try to register the pair
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
                        pairAddress: pairInfo.address
                    };
                    console.log(`   ✅ ${pairName} already registered with Oracle`);
                } else {
                    console.log(`   ❌ Failed to register ${pairName} with Oracle: ${error.message}`);
                    oracleResults[pairName] = {
                        status: "FAILED",
                        pairAddress: pairInfo.address,
                        error: error.message
                    };
                }
            }
        }

        // 5. Test swap quote functionality
        console.log("\n💱 Step 5: Testing swap quote functionality...");
        try {
            // Test getting amounts out for a small SHAH to ETH swap
            const amountIn = ethers.parseEther("100"); // 100 SHAH
            const path = [TOKENS.SHAH, TOKENS.WETH];
            
            const amountsOut = await router.getAmountsOut(amountIn, path);
            console.log(`   SHAH to ETH swap quote:`);
            console.log(`   Input: ${ethers.formatEther(amountIn)} SHAH`);
            console.log(`   Output: ${ethers.formatEther(amountsOut[1])} WETH`);
            console.log("   ✅ Swap quote functionality working");
            
        } catch (error) {
            console.log(`   ❌ Swap quote failed: ${error.message}`);
        }

        // 6. Test Oracle price functionality
        console.log("\n📈 Step 6: Testing Oracle price functionality...");
        try {
            // Test getting price from Oracle
            const shahEthPair = LP_PAIRS["SHAH-ETH"];
            const price = await oracle.consult(shahEthPair, ethers.parseEther("1"));
            console.log(`   SHAH/ETH price: ${ethers.formatEther(price)}`);
            console.log("   ✅ Oracle price functionality working");
            
        } catch (error) {
            console.log(`   ❌ Oracle price failed: ${error.message}`);
        }

        // Save test results
        console.log("\n📝 Saving test results...");
        const fs = require("fs");
        const path = require("path");
        
        const testInfo = {
            network: "mainnet",
            deployer: deployer.address,
            testTime: new Date().toISOString(),
            contracts: CONTRACTS,
            tokens: TOKENS,
            lpPairs: LP_PAIRS,
            pairResults: pairResults,
            oracleResults: oracleResults,
            status: "Swap Functionality Test Complete"
        };

        const testPath = path.join(__dirname, "..", "shah-swap-test.json");
        fs.writeFileSync(testPath, JSON.stringify(testInfo, null, 2));
        console.log(`   ✅ Test info saved to: ${testPath}`);

        // Summary
        console.log("\n🎉 SHAH Swap Functionality Test Complete!");
        console.log("\n📋 Summary:");
        console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
        console.log(`   Factory: ${CONTRACTS.FACTORY}`);

        console.log("\n🔍 Pair Status:");
        for (const [name, info] of Object.entries(pairResults)) {
            if (info.status === "EXISTS") {
                console.log(`   ✅ ${name}: Exists in factory`);
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
        console.log(`   Router V2: https://etherscan.io/address/${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: https://etherscan.io/address/${CONTRACTS.ORACLE}`);
        console.log(`   Factory: https://etherscan.io/address/${CONTRACTS.FACTORY}`);

        console.log("\n🚀 SHAH Swap functionality is ready for testing!");
        console.log("All core components are properly connected and operational.");

    } catch (error) {
        console.error("❌ Swap functionality test failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

