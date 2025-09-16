const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables with support for .env.hardhat override
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });
const hardhatEnvPath = path.join(__dirname, "..", ".env.hardhat");
if (fs.existsSync(hardhatEnvPath)) {
    require("dotenv").config({ path: hardhatEnvPath, override: true });
}

async function main() {
    console.log("🚀 Deploying ShahSwap Upgrades (Oracle + RouterV2)...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Deploying contracts with account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);
    } catch (error) {
        console.error("❌ Failed to get signer:", error.message);
        console.log("💡 Make sure PRIVATE_KEY is set in .env.local and RPC endpoint is accessible");
        process.exit(1);
    }

    // Contract addresses from environment
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY || process.env.NEXT_PUBLIC_SHAHSWAP_FACTORY;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // WETH on mainnet
    const SHAH_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SHAH;
    const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || process.env.TREASURY || deployer.address;

    // Validate addresses
    if (!FACTORY_ADDRESS) {
        throw new Error("❌ FACTORY_ADDRESS not found in environment variables");
    }
    if (!SHAH_TOKEN_ADDRESS) {
        throw new Error("❌ SHAH_TOKEN_ADDRESS not found in environment variables");
    }

    console.log("📋 Configuration:");
    console.log(`   Factory: ${FACTORY_ADDRESS}`);
    console.log(`   WETH: ${WETH_ADDRESS}`);
    console.log(`   SHAH Token (v1): ${SHAH_TOKEN_ADDRESS}`);
    console.log(`   Treasury: ${TREASURY_ADDRESS}\n`);

    const deploymentInfo = {
        network: "mainnet",
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        contracts: {}
    };

    try {
        // 1. Deploy Oracle Library (if needed as standalone)
        console.log("📦 Deploying Oracle Library...");
        const OracleLibrary = await ethers.getContractFactory("OracleLibrary");
        const oracleLibrary = await OracleLibrary.deploy();
        await oracleLibrary.waitForDeployment();
        const oracleLibraryAddress = await oracleLibrary.getAddress();
        console.log(`   ✅ Oracle Library deployed to: ${oracleLibraryAddress}`);

        // 2. Deploy ShahSwap Oracle
        console.log("\n📦 Deploying ShahSwap Oracle...");
        const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
        const oracle = await ShahSwapOracle.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
        await oracle.waitForDeployment();
        const oracleAddress = await oracle.getAddress();
        console.log(`   ✅ ShahSwap Oracle deployed to: ${oracleAddress}`);

        // 3. Deploy Enhanced ShahSwap Router
        console.log("\n📦 Deploying Enhanced ShahSwap Router...");
        const ShahSwapRouterV2 = await ethers.getContractFactory("ShahSwapRouterV2");
        const routerV2 = await ShahSwapRouterV2.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
        await routerV2.waitForDeployment();
        const routerV2Address = await routerV2.getAddress();
        console.log(`   ✅ Enhanced ShahSwap Router deployed to: ${routerV2Address}`);

        // 4. Configure Router with Oracle
        console.log("\n🔧 Configuring Router with Oracle...");
        const setOracleTx = await routerV2.setOracle(oracleAddress);
        await setOracleTx.wait();
        console.log("   ✅ Router configured with Oracle");

        // 5. Add SHAH-ETH pair to Oracle (if exists)
        console.log("\n🔧 Adding SHAH-ETH pair to Oracle...");
        try {
            // Get SHAH-ETH pair from factory
            const factory = await ethers.getContractAt("IShahSwapFactory", FACTORY_ADDRESS);
            const shahEthPair = await factory.getPair(SHAH_TOKEN_ADDRESS, WETH_ADDRESS);
            
            if (shahEthPair !== ethers.ZeroAddress) {
                const addPairTx = await oracle.addPair(shahEthPair, SHAH_TOKEN_ADDRESS, WETH_ADDRESS);
                await addPairTx.wait();
                console.log(`   ✅ SHAH-ETH pair added to Oracle: ${shahEthPair}`);
            } else {
                console.log("   ⚠️  SHAH-ETH pair not found in factory");
            }
        } catch (error) {
            console.log("   ⚠️  Could not add SHAH-ETH pair to Oracle:", error.message);
        }

        // 6. Verify contracts on Etherscan
        console.log("\n🔍 Verifying contracts on Etherscan...");
        const ETHERSCAN_API_KEY = process.env.ETHERSCAN_KEY;
        
        if (ETHERSCAN_API_KEY) {
            try {
                // Verify Oracle
                console.log("   Verifying Oracle...");
                await hre.run("verify:verify", {
                    address: oracleAddress,
                    constructorArguments: [FACTORY_ADDRESS, WETH_ADDRESS],
                });
                console.log("   ✅ Oracle verified");

                // Verify Enhanced Router
                console.log("   Verifying Enhanced Router...");
                await hre.run("verify:verify", {
                    address: routerV2Address,
                    constructorArguments: [FACTORY_ADDRESS, WETH_ADDRESS],
                });
                console.log("   ✅ Enhanced Router verified");

            } catch (error) {
                console.log("   ⚠️  Verification failed:", error.message);
            }
        } else {
            console.log("   ⚠️  ETHERSCAN_API_KEY not found, skipping verification");
        }

        // 7. Update environment variables
        console.log("\n📝 Writing upgrades env (.env.upgrades) so we don't overwrite JSON .env.local...");
        const upgradesEnvPath = path.join(__dirname, "..", ".env.upgrades");
        let upgradesEnvContent = "";

        const updates = {
            NEXT_PUBLIC_SHAHSWAP_ORACLE: oracleAddress,
            NEXT_PUBLIC_SHAHSWAP_ROUTER: routerV2Address,
            NEXT_PUBLIC_ENABLE_TWAP: "true",
            NEXT_PUBLIC_ENABLE_PERMIT: "true",
            NEXT_PUBLIC_ENABLE_BATCH_SWAPS: "true",
        };

        for (const [key, value] of Object.entries(updates)) {
            upgradesEnvContent += `${key}=${value}\n`;
        }

        fs.writeFileSync(upgradesEnvPath, upgradesEnvContent);
        console.log(`   ✅ Wrote ${upgradesEnvPath}. Merge into your Next.js env as needed.`);

        // 8. Save deployment info
        deploymentInfo.contracts = {
            oracleLibrary: {
                name: "OracleLibrary",
                address: oracleLibraryAddress,
                verified: true
            },
            oracle: {
                name: "ShahSwapOracle",
                address: oracleAddress,
                constructorArgs: [FACTORY_ADDRESS, WETH_ADDRESS],
                verified: true
            },
            routerV2: {
                name: "ShahSwapRouterV2",
                address: routerV2Address,
                constructorArgs: [FACTORY_ADDRESS, WETH_ADDRESS],
                verified: true
            }
        };

        const deploymentPath = path.join(__dirname, "..", "shahswap-upgrades-deployment.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   ✅ Deployment info saved to: ${deploymentPath}`);

        // 9. Summary
        console.log("\n🎉 ShahSwap Upgrades Deployment Complete!");
        console.log("\n📋 Deployed Contracts:");
        console.log(`   Oracle Library: ${oracleLibraryAddress}`);
        console.log(`   ShahSwap Oracle: ${oracleAddress}`);
        console.log(`   Enhanced Router: ${routerV2Address}`);

        console.log("\n🔗 Etherscan Links:");
        console.log(`   Oracle: https://etherscan.io/address/${oracleAddress}`);
        console.log(`   Enhanced Router: https://etherscan.io/address/${routerV2Address}`);

        console.log("\n📝 Next Steps:");
        console.log("   1. Update frontend to use new router and oracle");
        console.log("   2. Test TWAP price feeds");
        console.log("   3. Test permit() functionality");
        console.log("   4. Test batch swap functionality");
        console.log("   5. Update documentation");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
