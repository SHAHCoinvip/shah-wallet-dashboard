const hre = require("hardhat");

// Oracle and factory addresses
const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
const ORACLE_FACTORY = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";
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
	console.log("\n🔗 Final LP Pair Registration Attempt...\n");
	
	const [signer] = await hre.ethers.getSigners();
	console.log("👤 Current signer:", signer.address);
	
	try {
		const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS, signer);
		
		// Check ownership
		const owner = await oracle.owner();
		console.log("🏛️  Oracle owner:", owner);
		
		if (owner.toLowerCase() !== signer.address.toLowerCase()) {
			console.log("❌ Current signer is NOT the oracle owner");
			return;
		}
		
		console.log("✅ Current signer IS the oracle owner");
		
		// Check current factory
		const currentFactory = await oracle.factory();
		console.log("🏭 Oracle factory:", currentFactory);
		console.log("🎯 Our LP pairs are in factory:", CORRECT_FACTORY);
		
		if (currentFactory.toLowerCase() === CORRECT_FACTORY.toLowerCase()) {
			console.log("✅ Oracle is using the correct factory!");
		} else {
			console.log("❌ Oracle is using different factory");
			console.log("💡 This explains why addPair() is failing");
		}
		
		// Try to add pairs anyway (in case there's a workaround)
		console.log("\n🔄 Attempting to add pairs...");
		
		for (const p of pairs) {
			console.log(`\n➡️  Adding pair ${p.label}  (${p.pair})`);
			try {
				// Check if already supported
				const isSupported = await oracle.isPairSupported(p.pair);
				if (isSupported) {
					console.log("   ⚠️  Pair already supported by oracle");
					continue;
				}
				
				// Try to add the pair
				const tx = await oracle.addPair(p.pair, p.token0, p.token1, txGas);
				console.log("   🧾 Sent:", tx.hash);
				await tx.wait();
				console.log("   ✅ Confirmed");
				
			} catch (err) {
				console.error("   ❌ Failed:", err?.reason || err?.message || err);
				
				// Provide specific guidance based on error
				if (err?.reason?.includes("PAIR_NOT_IN_FACTORY")) {
					console.log("   💡 Error: Pair doesn't exist in oracle's factory");
					console.log("   🔍 Oracle factory:", currentFactory);
					console.log("   🔍 Pair factory:", CORRECT_FACTORY);
					console.log("   💡 Solution: Oracle needs to use the correct factory");
				} else if (err?.reason?.includes("INSUFFICIENT_LIQUIDITY")) {
					console.log("   💡 Error: Pair doesn't meet minimum liquidity requirements");
					console.log("   💡 Solution: Add more liquidity to the pair");
				} else if (err?.reason?.includes("PAIR_ALREADY_SUPPORTED")) {
					console.log("   💡 Error: Pair is already supported by the oracle");
				}
			}
		}
		
		console.log("\n📝 Summary:");
		console.log("The oracle is configured with factory:", currentFactory);
		console.log("But our LP pairs exist in factory:", CORRECT_FACTORY);
		console.log("\n💡 Root Cause:");
		console.log("The oracle's addPair() function checks if pairs exist in its configured factory");
		console.log("Since the factories don't match, the check fails and the transaction reverts");
		
		console.log("\n🚀 Recommended Solutions:");
		console.log("1. Deploy new oracle with correct factory (requires contract upgrade)");
		console.log("2. Update existing oracle to use correct factory (if upgrade function exists)");
		console.log("3. Create pairs in oracle's current factory (if possible)");
		console.log("4. Use manual Etherscan interaction to add pairs (if oracle allows)");
		
		console.log("\n🔗 Current Status:");
		console.log("✅ Oracle deployed and owned by current signer");
		console.log("✅ LP pairs exist in correct factory");
		console.log("❌ Oracle cannot add pairs due to factory mismatch");
		
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

