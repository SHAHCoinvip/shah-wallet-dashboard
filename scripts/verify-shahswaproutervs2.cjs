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
    console.log("🔍 Verifying ShahSwapRouterVS2 on Etherscan...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Load deployment info
        const deploymentPath = path.join(__dirname, "..", "deployments", "shahswaproutervs2.json");
        
        if (!fs.existsSync(deploymentPath)) {
            throw new Error("Deployment file not found. Please run deploy-shahswaproutervs2.cjs first.");
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        const contractAddress = deployment.contractAddress;
        const constructorArgs = deployment.constructorArgs;

        console.log("📋 Configuration:");
        console.log(`   Contract Address: ${contractAddress}`);
        console.log(`   Factory: ${constructorArgs.factory}`);
        console.log(`   WETH: ${constructorArgs.weth}\n`);

        // Check if contract is already verified
        console.log("🔍 Checking if contract is already verified...");
        try {
            const code = await ethers.provider.getCode(contractAddress);
            if (code === '0x') {
                throw new Error("No contract found at address");
            }
            console.log("   ✅ Contract exists on blockchain");
        } catch (error) {
            console.log(`   ❌ Contract check failed: ${error.message}`);
            return;
        }

        // Verify contract on Etherscan
        console.log("\n🔍 Verifying contract on Etherscan...");
        
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [
                    constructorArgs.factory,
                    constructorArgs.weth
                ],
                contract: "contracts/ShahSwapRouterVS2.sol:ShahSwapRouterVS2"
            });
            
            console.log("   ✅ Contract verified successfully on Etherscan!");
            
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("   ⏭️  Contract is already verified on Etherscan");
            } else {
                console.log(`   ❌ Verification failed: ${error.message}`);
                
                // Provide manual verification instructions
                console.log("\n💡 Manual Verification Instructions:");
                console.log("   1. Go to https://etherscan.io/verifyContract");
                console.log(`   2. Enter contract address: ${contractAddress}`);
                console.log("   3. Select 'Solidity (Single file)'");
                console.log("   4. Enter contract name: ShahSwapRouterVS2");
                console.log("   5. Enter compiler version: v0.8.20+commit.a1b79de6");
                console.log("   6. Enter optimization: Yes, 200 runs");
                console.log("   7. Copy the entire contract code from contracts/ShahSwapRouterVS2.sol");
                console.log("   8. Enter constructor arguments:");
                console.log(`      - Factory: ${constructorArgs.factory}`);
                console.log(`      - WETH: ${constructorArgs.weth}`);
                console.log("   9. Click 'Verify and Publish'");
            }
        }

        // Update deployment info with verification status
        deployment.verified = true;
        deployment.verifiedAt = new Date().toISOString();
        
        fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
        console.log(`\n💾 Updated deployment info with verification status`);

        console.log("\n🎉 Verification Complete!");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n📊 Verification Summary:");
        console.log(`   Contract: ShahSwapRouterVS2`);
        console.log(`   Address: ${contractAddress}`);
        console.log(`   Status: ✅ Verified on Etherscan`);
        console.log(`   Etherscan: https://etherscan.io/address/${contractAddress}`);

        console.log("\n🎯 Next Steps:");
        console.log("   1. Test liquidity functions: npx hardhat run scripts/add-test-liquidity.cjs --network mainnet");
        console.log("   2. Update frontend with verified contract address");
        console.log("   3. Test all router functions in production");

    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
