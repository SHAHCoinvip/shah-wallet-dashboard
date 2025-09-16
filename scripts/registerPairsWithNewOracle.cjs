const hre = require("hardhat");

// New Oracle and factory addresses
const NEW_ORACLE_ADDRESS = "0x608475033ac2c8B779043FB6F9B53d0633C7c79a";
const CORRECT_FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";

// Gas settings
const txGas = {
	gasLimit: 300000,
	maxFeePerGas: hre.ethers.parseUnits("3", "gwei"),
	maxPriorityFeePerGas: hre.ethers.parseUnits("1.5", "gwei"),
};

// LP Pairs to register (from the correct factory)
const pairs = [
	{
		label: "SHAH/ETH",
		pair: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
	},
	{
		label: "SHAH/USDT",
		pair: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
	},
	{
		label: "SHAH/DAI",
		pair: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
	},
];

async function main() {
	console.log("\n🔗 Registering LP Pairs with New Oracle...\n");
	
	const [signer] = await hre.ethers.getSigners();
	console.log("👤 Current signer:", signer.address);
	
	try {
		const oracle = await hre.ethers.getContractAt("ShahSwapOracle", NEW_ORACLE_ADDRESS, signer);
		
		// Check ownership
		const owner = await oracle.owner();
		console.log("🏛️  Oracle owner:", owner);
		
		if (owner.toLowerCase() !== signer.address.toLowerCase()) {
			console.log("❌ Current signer is NOT the oracle owner");
			return;
		}
		
		console.log("✅ Current signer IS the oracle owner");
		
		// Check factory address
		try {
			const factory = await oracle.factory();
			console.log("🏭 Oracle factory:", factory);
			
			if (factory.toLowerCase() === CORRECT_FACTORY.toLowerCase()) {
				console.log("✅ Oracle is using the correct factory!");
			} else {
				console.log("❌ Oracle is using different factory");
				console.log("💡 This might cause issues with pair registration");
			}
		} catch (error) {
			console.log("⚠️  Could not read factory address:", error.message);
			console.log("💡 Continuing with pair registration...");
		}
		
		// Register pairs
		console.log("\n🔄 Registering LP pairs...");
		const results = [];
		
		for (const p of pairs) {
			console.log(`\n➡️  Registering ${p.label} pair...`);
			try {
				// Check if already supported
				const isSupported = await oracle.isPairSupported(p.pair);
				if (isSupported) {
					console.log("   ⚠️  Pair already supported by oracle");
					results.push({ label: p.label, status: "already_supported" });
					continue;
				}
				
				// Register the pair
				const tx = await oracle.addPair(p.pair, p.token0, p.token1, txGas);
				console.log("   🧾 Registration transaction sent:", tx.hash);
				await tx.wait();
				console.log("   ✅ Pair registered successfully");
				
				results.push({ label: p.label, status: "registered", txHash: tx.hash });
				
			} catch (err) {
				console.error("   ❌ Failed to register pair:", err?.reason || err?.message || err);
				results.push({ label: p.label, status: "failed", error: err?.reason || err?.message || err });
			}
		}
		
		// Summary
		console.log("\n📋 Registration Results:");
		for (const result of results) {
			if (result.status === "registered") {
				console.log(`   ✅ ${result.label}: Registered (${result.txHash})`);
			} else if (result.status === "already_supported") {
				console.log(`   ⚠️  ${result.label}: Already supported`);
			} else {
				console.log(`   ❌ ${result.label}: Failed (${result.error})`);
			}
		}
		
		// Save results
		const fs = require("fs");
		const path = require("path");
		const resultsPath = path.join(__dirname, "..", "oracle-pair-registration-results.json");
		fs.writeFileSync(resultsPath, JSON.stringify({
			oracle: NEW_ORACLE_ADDRESS,
			factory: CORRECT_FACTORY,
			deployer: signer.address,
			registrationTime: new Date().toISOString(),
			results: results
		}, null, 2));
		console.log(`\n📄 Results saved to: ${resultsPath}`);
		
		console.log("\n🎉 Pair Registration Complete!");
		console.log("\n🔗 New Oracle Address:", NEW_ORACLE_ADDRESS);
		console.log("🔗 Etherscan:", `https://etherscan.io/address/${NEW_ORACLE_ADDRESS}`);
		
	} catch (error) {
		console.error("❌ Script failed:", error.message);
	}
}

main()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error("Script failed:", e);
		process.exit(1);
	});

