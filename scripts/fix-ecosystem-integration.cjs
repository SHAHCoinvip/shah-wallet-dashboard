const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔧 Fixing SHAH Ecosystem Integration Issues...\n");
    console.log("=" .repeat(60));

    // Contract addresses
    const CONTRACTS = {
        // Factories
        SHAH_FACTORY: "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a", // Token Factory (don't touch)
        SHAHSWAP_FACTORY: "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204", // LP Factory
        
        // Core contracts (need to be redeployed)
        ROUTER_V2_OLD: "0x20794d26397f2b81116005376AbEc0B995e9D502", // Old router
        ORACLE_OLD: "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52", // Old oracle
        
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

    console.log("📋 Current Issues:");
    console.log("   ❌ Router V2 pointing to wrong factory (token factory instead of LP factory)");
    console.log("   ❌ Oracle pointing to wrong factory (token factory instead of LP factory)");
    console.log("   ❌ Oracle can't register pairs due to factory mismatch\n");

    console.log("📋 Solution:");
    console.log("   🔄 Redeploy Router V2 with correct LP factory");
    console.log("   🔄 Redeploy Oracle with correct LP factory");
    console.log("   🔄 Register pairs with new Oracle\n");

    console.log("📋 Configuration:");
    console.log(`   ShahSwap Factory (LP): ${CONTRACTS.SHAHSWAP_FACTORY}`);
    console.log(`   SHAH Factory (Token): ${CONTRACTS.SHAH_FACTORY}`);
    console.log(`   Treasury: ${CONTRACTS.TREASURY}`);
    console.log(`   WETH: ${TOKENS.WETH}\n`);

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // 1. Deploy new Router V2 with correct factory
        console.log("🔄 Step 1: Deploying new Router V2 with correct factory...");
        const ShahSwapRouterV2 = await ethers.getContractFactory("ShahSwapRouterV2");
        const routerV2 = await ShahSwapRouterV2.deploy(CONTRACTS.SHAHSWAP_FACTORY, TOKENS.WETH);
        await routerV2.waitForDeployment();
        const routerV2Address = await routerV2.getAddress();
        console.log(`   ✅ New Router V2 deployed: ${routerV2Address}`);

        // 2. Deploy new Oracle with correct factory
        console.log("\n🔄 Step 2: Deploying new Oracle with correct factory...");
        const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
        const oracle = await ShahSwapOracle.deploy(CONTRACTS.SHAHSWAP_FACTORY, TOKENS.WETH);
        await oracle.waitForDeployment();
        const oracleAddress = await oracle.getAddress();
        console.log(`   ✅ New Oracle deployed: ${oracleAddress}`);

        // 3. Configure Router V2 with Oracle
        console.log("\n🔧 Step 3: Configuring Router V2 with Oracle...");
        const setOracleTx = await routerV2.setOracle(oracleAddress);
        await setOracleTx.wait();
        console.log("   ✅ Router V2 configured with Oracle");

        // 4. Verify contracts on Etherscan
        console.log("\n🔍 Step 4: Verifying contracts on Etherscan...");
        const ETHERSCAN_API_KEY = process.env.ETHERSCAN_KEY;
        
        if (ETHERSCAN_API_KEY) {
            try {
                // Verify Router V2
                console.log("   Verifying Router V2...");
                await hre.run("verify:verify", {
                    address: routerV2Address,
                    constructorArguments: [CONTRACTS.SHAHSWAP_FACTORY, TOKENS.WETH],
                });
                console.log("   ✅ Router V2 verified");

                // Verify Oracle
                console.log("   Verifying Oracle...");
                await hre.run("verify:verify", {
                    address: oracleAddress,
                    constructorArguments: [CONTRACTS.SHAHSWAP_FACTORY, TOKENS.WETH],
                });
                console.log("   ✅ Oracle verified");

            } catch (error) {
                console.log("   ⚠️  Verification failed:", error.message);
            }
        } else {
            console.log("   ⚠️  ETHERSCAN_API_KEY not found, skipping verification");
        }

        // 5. Register pairs with new Oracle
        console.log("\n📊 Step 5: Registering pairs with new Oracle...");
        const factory = await ethers.getContractAt("ShahSwapFactory", CONTRACTS.SHAHSWAP_FACTORY);
        
        const pairsToRegister = [
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.WETH, name: "SHAH-ETH" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDC, name: "SHAH-USDC" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.USDT, name: "SHAH-USDT" },
            { tokenA: TOKENS.SHAH, tokenB: TOKENS.DAI, name: "SHAH-DAI" }
        ];

        const oracleResults = {};

        for (const pair of pairsToRegister) {
            try {
                console.log(`   Registering ${pair.name} with Oracle...`);
                
                // Get pair address from factory
                const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
                
                if (pairAddress === ethers.ZeroAddress) {
                    console.log(`   ⚠️  ${pair.name} pair not found in factory`);
                    continue;
                }

                // Determine token0 and token1 (sorted order)
                const token0 = pair.tokenA < pair.tokenB ? pair.tokenA : pair.tokenB;
                const token1 = pair.tokenA < pair.tokenB ? pair.tokenB : pair.tokenA;
                
                const addPairTx = await oracle.addPair(pairAddress, token0, token1);
                await addPairTx.wait();
                
                oracleResults[pair.name] = {
                    status: "REGISTERED",
                    pairAddress: pairAddress,
                    token0: token0,
                    token1: token1
                };
                console.log(`   ✅ ${pair.name} registered with Oracle: ${pairAddress}`);
                
            } catch (error) {
                console.log(`   ❌ Failed to register ${pair.name} with Oracle: ${error.message}`);
                oracleResults[pair.name] = {
                    status: "FAILED",
                    error: error.message
                };
            }
        }

        // 6. Update environment variables
        console.log("\n📝 Step 6: Updating environment variables...");
        const fs = require("fs");
        const path = require("path");
        const envPath = path.join(__dirname, "..", ".env.local");
        let envContent = "";
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        }

        // Add or update environment variables
        const updates = {
            "NEXT_PUBLIC_SHAHSWAP_ROUTER": routerV2Address,
            "NEXT_PUBLIC_SHAHSWAP_ORACLE": oracleAddress
        };

        for (const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*`, "m");
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        }

        fs.writeFileSync(envPath, envContent);
        console.log("   ✅ Environment variables updated");

        // 7. Save deployment info
        const deploymentInfo = {
            network: "mainnet",
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            contracts: {
                routerV2: {
                    address: routerV2Address,
                    factory: CONTRACTS.SHAHSWAP_FACTORY,
                    weth: TOKENS.WETH,
                    oracle: oracleAddress
                },
                oracle: {
                    address: oracleAddress,
                    factory: CONTRACTS.SHAHSWAP_FACTORY,
                    weth: TOKENS.WETH
                },
                factory: CONTRACTS.SHAHSWAP_FACTORY,
                treasury: CONTRACTS.TREASURY
            },
            oracleResults: oracleResults,
            status: "SHAH Ecosystem Integration Fixed"
        };

        const deploymentPath = path.join(__dirname, "..", "shah-ecosystem-fixed.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   ✅ Deployment info saved to: ${deploymentPath}`);

        // 8. Summary
        console.log("\n🎉 SHAH Ecosystem Integration Fixed!");
        console.log("\n📋 Summary:");
        console.log(`   ✅ New Router V2: ${routerV2Address}`);
        console.log(`   ✅ New Oracle: ${oracleAddress}`);
        console.log(`   ✅ Factory: ${CONTRACTS.SHAHSWAP_FACTORY}`);
        console.log(`   ✅ Treasury: ${CONTRACTS.TREASURY}`);

        console.log("\n📊 Oracle Registration Status:");
        for (const [name, info] of Object.entries(oracleResults)) {
            if (info.status === "REGISTERED") {
                console.log(`   ✅ ${name}: ${info.pairAddress}`);
            } else {
                console.log(`   ❌ ${name}: ${info.status}`);
            }
        }

        console.log("\n🔗 Etherscan Links:");
        console.log(`   New Router V2: https://etherscan.io/address/${routerV2Address}`);
        console.log(`   New Oracle: https://etherscan.io/address/${oracleAddress}`);
        console.log(`   Factory: https://etherscan.io/address/${CONTRACTS.SHAHSWAP_FACTORY}`);

        console.log("\n📝 Environment Variables Updated:");
        console.log(`   NEXT_PUBLIC_SHAHSWAP_ROUTER=${routerV2Address}`);
        console.log(`   NEXT_PUBLIC_SHAHSWAP_ORACLE=${oracleAddress}`);

        console.log("\n🚀 SHAH Ecosystem is now properly integrated!");
        console.log("All components are connected with the correct factory.");

    } catch (error) {
        console.error("❌ Integration fix failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

