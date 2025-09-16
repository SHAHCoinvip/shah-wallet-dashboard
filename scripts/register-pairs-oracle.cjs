const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });
const hardhatEnvPath = path.join(__dirname, "..", ".env.hardhat");
if (fs.existsSync(hardhatEnvPath)) {
    require("dotenv").config({ path: hardhatEnvPath, override: true });
}

async function main() {
    console.log("📊 Registering Existing Pairs in Oracle...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Contract addresses (canonical)
        const ORACLE = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        // Existing pair addresses (from previous script output)
        const EXISTING_PAIRS = {
            "SHAH/USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
            "SHAH/DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
            "SHAH/ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e"
        };

        console.log("📋 Configuration:");
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);

        console.log("🔍 Verifying existing pairs...");
        
        // Verify pairs exist in factory
        for (const [pairName, pairAddress] of Object.entries(EXISTING_PAIRS)) {
            let token0, token1;
            if (pairName === "SHAH/ETH") {
                token0 = TOKENS.SHAH;
                token1 = TOKENS.WETH;
            } else if (pairName === "SHAH/USDT") {
                token0 = TOKENS.SHAH;
                token1 = TOKENS.USDT;
            } else if (pairName === "SHAH/DAI") {
                token0 = TOKENS.SHAH;
                token1 = TOKENS.DAI;
            }

            const factoryPair = await factory.getPair(token0, token1);
            if (factoryPair === pairAddress) {
                console.log(`   ✅ ${pairName}: ${pairAddress} (verified in factory)`);
            } else {
                console.log(`   ⚠️  ${pairName}: ${pairAddress} (not found in factory, found: ${factoryPair})`);
            }
        }
        console.log("");

        // Step 1: Register pairs in Oracle
        console.log("📊 Step 1: Registering pairs in Oracle...\n");

        const oracleResults = {};

        for (const [pairName, pairAddress] of Object.entries(EXISTING_PAIRS)) {
            console.log(`   Registering ${pairName} in Oracle...`);
            console.log(`   Pair Address: ${pairAddress}`);
            
            try {
                let token0, token1;
                if (pairName === "SHAH/ETH") {
                    token0 = TOKENS.SHAH;
                    token1 = TOKENS.WETH;
                } else if (pairName === "SHAH/USDT") {
                    token0 = TOKENS.SHAH;
                    token1 = TOKENS.USDT;
                } else if (pairName === "SHAH/DAI") {
                    token0 = TOKENS.SHAH;
                    token1 = TOKENS.DAI;
                }

                // Check if pair is already registered
                const isSupported = await oracle.isPairSupported(pairAddress);
                if (isSupported) {
                    console.log(`   ⏭️  ${pairName} already registered in Oracle`);
                    oracleResults[pairName] = {
                        pairAddress,
                        status: "already_registered"
                    };
                    continue;
                }

                // Register the pair
                const oracleTx = await oracle.addPair(pairAddress, token0, token1);
                await oracleTx.wait();
                
                oracleResults[pairName] = {
                    pairAddress,
                    txHash: oracleTx.hash,
                    status: "success"
                };
                console.log(`   ✅ ${pairName} registered in Oracle: ${oracleTx.hash}`);
                
            } catch (error) {
                oracleResults[pairName] = {
                    pairAddress,
                    status: "failed",
                    error: error.message
                };
                console.log(`   ❌ Failed to register ${pairName}: ${error.message}`);
            }
            console.log("");
        }

        // Summary
        console.log("🎉 Oracle Registration Complete!\n");
        
        console.log("📊 Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n📊 Oracle Registration Results:");
        for (const [pairName, result] of Object.entries(oracleResults)) {
            console.log(`   ${pairName}:`);
            console.log(`     Pair Address: ${result.pairAddress}`);
            if (result.status === "success") {
                console.log(`     ✅ Status: Registered`);
                console.log(`     Transaction: ${result.txHash}`);
            } else if (result.status === "already_registered") {
                console.log(`     ⏭️  Status: Already Registered`);
            } else {
                console.log(`     ❌ Status: Failed`);
                console.log(`     Error: ${result.error}`);
            }
        }

        console.log("\n🔗 Contract Links:");
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);

        console.log("\n📈 Next Steps:");
        console.log("   1. Verify Oracle registration on Etherscan");
        console.log("   2. Test TWAP price feeds");
        console.log("   3. Test swaps on the frontend");
        console.log("   4. Add more liquidity as needed");

        // Save results to file
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            oracleResults,
            configuration: {
                oracle: ORACLE,
                factory: FACTORY,
                shahToken: SHAH_TOKEN
            }
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "oracle-registration-results.json"),
            JSON.stringify(results, null, 2)
        );

        console.log("\n💾 Results saved to: oracle-registration-results.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
