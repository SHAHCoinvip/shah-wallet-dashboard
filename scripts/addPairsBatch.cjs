const hre = require("hardhat");

// ShahSwapOracle (already deployed)
const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
// Use the factory address that the oracle is actually configured with
const FACTORY_ADDRESS = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";

// Helper to support both ethers v5/v6 styles for parseUnits
const parseUnits = (value, unit) => {
	if (hre.ethers?.utils?.parseUnits) return hre.ethers.utils.parseUnits(value, unit);
	if (hre.ethers?.parseUnits) return hre.ethers.parseUnits(value, unit);
	throw new Error("parseUnits not found on hre.ethers");
};

// Gas settings to avoid high wallet quotes
const txGas = {
	gasLimit: 250000,
	maxFeePerGas: parseUnits("3", "gwei"),
	maxPriorityFeePerGas: parseUnits("1.5", "gwei"),
};

// LP Pairs to register
const pairs = [
	// Core Stable/ETH
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
	console.log("\n🔗 Using oracle:", ORACLE_ADDRESS);
	console.log("🏭 Oracle factory:", FACTORY_ADDRESS);
	const [signer] = await hre.ethers.getSigners();
	console.log("👤 Deployer:", signer.address);

	try {
		const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS, signer);
		
		// Check if we're the owner
		const owner = await oracle.owner();
		if (owner.toLowerCase() !== signer.address.toLowerCase()) {
			console.log("❌ Current signer is NOT the oracle owner");
			console.log("💡 You need to use the owner account to add pairs");
			return;
		}
		console.log("✅ Current signer IS the oracle owner");

		for (const p of pairs) {
			console.log(`\n➡️  Adding pair ${p.label}  (${p.pair})`);
			try {
				// Check if pair is already supported
				const isSupported = await oracle.isPairSupported(p.pair);
				if (isSupported) {
					console.log("   ⚠️  Pair already supported by oracle");
					continue;
				}

				const tx = await oracle.addPair(p.pair, p.token0, p.token1, txGas);
				console.log("   🧾 Sent:", tx.hash);
				await tx.wait();
				console.log("   ✅ Confirmed");
			} catch (err) {
				console.error("   ❌ Failed:", err?.reason || err?.message || err);
				
				// Try to get more details about the error
				if (err?.reason?.includes("PAIR_NOT_IN_FACTORY")) {
					console.log("   💡 Error: Pair doesn't exist in the factory the oracle is configured with");
					console.log("   🔍 The oracle is configured with factory:", FACTORY_ADDRESS);
					console.log("   🔍 But the pair was created in a different factory");
				} else if (err?.reason?.includes("INSUFFICIENT_LIQUIDITY")) {
					console.log("   💡 Error: Pair doesn't meet minimum liquidity requirements");
				} else if (err?.reason?.includes("PAIR_ALREADY_SUPPORTED")) {
					console.log("   💡 Error: Pair is already supported by the oracle");
				}
			}
		}

		console.log("\n🎉 Batch registration complete\n");
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
