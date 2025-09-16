const hre = require("hardhat");

// Configuration
const CORRECT_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
	console.log("\n🔗 Deploying New ShahSwapOracle (Simple)...\n");
	
	const [signer] = await hre.ethers.getSigners();
	console.log("👤 Deployer:", signer.address);
	
	try {
		// Deploy new oracle with default gas settings
		console.log("🏭 Deploying ShahSwapOracle...");
		console.log(`   Factory: ${CORRECT_FACTORY}`);
		console.log(`   WETH: ${WETH_ADDRESS}`);
		
		const ShahSwapOracle = await hre.ethers.getContractFactory("ShahSwapOracle");
		const oracle = await ShahSwapOracle.deploy(CORRECT_FACTORY, WETH_ADDRESS);
		console.log("   🧾 Deployment transaction sent...");
		
		await oracle.waitForDeployment();
		const oracleAddress = await oracle.getAddress();
		console.log(`\n✅ Oracle deployed to: ${oracleAddress}`);
		
		// Verify deployment
		console.log("\n🔍 Verifying deployment...");
		const deployedOracle = await hre.ethers.getContractAt("ShahSwapOracle", oracleAddress, signer);
		
		const factory = await deployedOracle.factory();
		const weth = await deployedOracle.WETH();
		const owner = await deployedOracle.owner();
		
		console.log(`   Factory: ${factory}`);
		console.log(`   WETH: ${weth}`);
		console.log(`   Owner: ${owner}`);
		
		// Check if factory matches
		if (factory.toLowerCase() === CORRECT_FACTORY.toLowerCase()) {
			console.log("✅ Factory address matches");
		} else {
			console.log("❌ Factory address mismatch");
		}
		
		// Check if WETH matches
		if (weth.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
			console.log("✅ WETH address matches");
		} else {
			console.log("❌ WETH address mismatch");
		}
		
		// Check if deployer is owner
		if (owner.toLowerCase() === signer.address.toLowerCase()) {
			console.log("✅ Deployer is owner");
		} else {
			console.log("❌ Deployer is not owner");
		}
		
		// Save deployment info
		const deploymentInfo = {
			network: "mainnet",
			deployer: signer.address,
			deploymentTime: new Date().toISOString(),
			oracle: {
				address: oracleAddress,
				factory: CORRECT_FACTORY,
				weth: WETH_ADDRESS,
				owner: signer.address
			},
			status: "New oracle deployed with correct factory"
		};
		
		const fs = require("fs");
		const path = require("path");
		const deploymentPath = path.join(__dirname, "..", "new-oracle-deployment.json");
		fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
		console.log(`\n📄 Deployment info saved to: ${deploymentPath}`);
		
		// Summary
		console.log("\n🎉 New Oracle Deployment Complete!");
		console.log("\n📋 Summary:");
		console.log(`   Oracle: ${oracleAddress}`);
		console.log(`   Factory: ${CORRECT_FACTORY}`);
		console.log(`   WETH: ${WETH_ADDRESS}`);
		console.log(`   Owner: ${signer.address}`);
		
		console.log("\n🔗 Etherscan Links:");
		console.log(`   Oracle: https://etherscan.io/address/${oracleAddress}`);
		console.log(`   Factory: https://etherscan.io/address/${CORRECT_FACTORY}`);
		
		console.log("\n🚀 Next Steps:");
		console.log("   1. Verify the oracle contract on Etherscan");
		console.log("   2. Add LP pairs to the new oracle");
		console.log("   3. Update any contracts that reference the old oracle");
		console.log("   4. Test the new oracle with existing LP pairs");
		
	} catch (error) {
		console.error("❌ Deployment failed:", error.message);
		console.log("\n💡 Trying alternative approach...");
		
		// Try to deploy with even simpler settings
		try {
			console.log("\n🔄 Attempting deployment with minimal settings...");
			const ShahSwapOracle = await hre.ethers.getContractFactory("ShahSwapOracle");
			const oracle = await ShahSwapOracle.deploy(CORRECT_FACTORY, WETH_ADDRESS, {
				gasLimit: 2000000
			});
			console.log("   🧾 Deployment transaction sent with minimal gas...");
			
			await oracle.waitForDeployment();
			const oracleAddress = await oracle.getAddress();
			console.log(`\n✅ Oracle deployed to: ${oracleAddress}`);
			
		} catch (retryError) {
			console.error("❌ Retry deployment also failed:", retryError.message);
		}
	}
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("Script failed:", e);
		process.exit(1);
	});

