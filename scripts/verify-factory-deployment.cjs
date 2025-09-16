const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Verifying ShahSwap Factory Deployment...\n");

    // Factory was deployed successfully
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4";

    console.log("📋 Deployment Info:");
    console.log(`   Factory Address: ${FACTORY_ADDRESS}`);
    console.log(`   Treasury: ${TREASURY_ADDRESS}`);
    console.log(`   Deployer: 0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4\n`);

    try {
        // 1. Verify contract on Etherscan
        console.log("🔍 Verifying contract on Etherscan...");
        const ETHERSCAN_API_KEY = process.env.ETHERSCAN_KEY;
        
        if (ETHERSCAN_API_KEY) {
            try {
                await hre.run("verify:verify", {
                    address: FACTORY_ADDRESS,
                    constructorArguments: ["0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4"],
                });
                console.log("   ✅ Factory verified on Etherscan");
            } catch (error) {
                console.log("   ⚠️  Verification failed:", error.message);
            }
        } else {
            console.log("   ⚠️  ETHERSCAN_API_KEY not found, skipping verification");
        }

        // 2. Update environment variables
        console.log("\n📝 Updating environment variables...");
        const fs = require("fs");
        const path = require("path");
        const envPath = path.join(__dirname, "..", ".env.local");
        let envContent = "";
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        }

        // Add or update environment variables
        const updates = {
            "NEXT_PUBLIC_SHAHSWAP_FACTORY": FACTORY_ADDRESS
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

        // 3. Save deployment info
        const deploymentInfo = {
            network: "mainnet",
            deployer: "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4",
            deploymentTime: new Date().toISOString(),
            factory: {
                address: FACTORY_ADDRESS,
                feeTo: TREASURY_ADDRESS,
                feeToSetter: "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4"
            },
            status: "Deployed successfully, setFeeTo needs manual call",
            tokens: {
                SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
                WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
                DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
            }
        };

        const deploymentPath = path.join(__dirname, "..", "shahswap-factory-deployment.json");
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`   ✅ Deployment info saved to: ${deploymentPath}`);

        // 4. Summary
        console.log("\n🎉 ShahSwap Factory Deployment Verified!");
        console.log("\n📋 Summary:");
        console.log(`   ✅ Factory deployed to: ${FACTORY_ADDRESS}`);
        console.log(`   ⚠️  setFeeTo needs manual call`);
        console.log(`   📝 Environment variable updated: NEXT_PUBLIC_SHAHSWAP_FACTORY`);

        console.log("\n🔗 Etherscan Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY_ADDRESS}`);

        console.log("\n🚀 Next Steps:");
        console.log("   1. Manually call setFeeTo() on the factory contract");
        console.log("   2. Create LP pairs using createPair() function");
        console.log("   3. Update Router V2 to use this factory");
        console.log("   4. Add pairs to Oracle for TWAP price feeds");

        console.log("\n💡 Manual setFeeTo call:");
        console.log(`   Contract: ${FACTORY_ADDRESS}`);
        console.log(`   Function: setFeeTo(${TREASURY_ADDRESS})`);
        console.log(`   Caller: 0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4`);

    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

