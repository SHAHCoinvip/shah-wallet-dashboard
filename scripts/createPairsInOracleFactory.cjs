const hre = require("hardhat");

// Oracle and its configured factory
const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
const ORACLE_FACTORY_ADDRESS = "0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a";

// Gas settings
const txGas = {
	gasLimit: 300000,
	maxFeePerGas: hre.ethers.parseUnits("3", "gwei"),
	maxPriorityFeePerGas: hre.ethers.parseUnits("1.5", "gwei"),
};

// Pairs to create and register
const pairs = [
	{
		label: "SHAH/ETH",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
	},
	{
		label: "SHAH/USDT",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
	},
	{
		label: "SHAH/DAI",
		token0: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8", // SHAH
		token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
	},
];

async function main() {
	console.log("\n🏭 Creating Pairs in Oracle Factory...\n");
	
	const [signer] = await hre.ethers.getSigners();
	console.log("👤 Deployer:", signer.address);
	
	try {
		const factory = await hre.ethers.getContractAt("ShahSwapFactory", ORACLE_FACTORY_ADDRESS, signer);
		const oracle = await hre.ethers.getContractAt("ShahSwapOracle", ORACLE_ADDRESS, signer);
		
		// Check ownership
		const factoryOwner = await factory.owner();
		const oracleOwner = await oracle.owner();
		
		console.log("🏛️  Factory owner:", factoryOwner);
		console.log("🔐 Oracle owner:", oracleOwner);
		console.log("🔐 Is current signer factory owner?", factoryOwner.toLowerCase() === signer.address.toLowerCase());
		console.log("🔐 Is current signer oracle owner?", oracleOwner.toLowerCase() === signer.address.toLowerCase());
		
		if (factoryOwner.toLowerCase() !== signer.address.toLowerCase()) {
			console.log("❌ Current signer is NOT the factory owner");
			return;
		}
		
		if (oracleOwner.toLowerCase() !== signer.address.toLowerCase()) {
			console.log("❌ Current signer is NOT the oracle owner");
			return;
		}
		
		console.log("✅ Current signer owns both factory and oracle\n");
		
		// Step 1: Create pairs in the factory
		console.log("🔄 Step 1: Creating pairs in factory...");
		const createdPairs = {};
		
		for (const pair of pairs) {
			console.log(`\n📊 Creating ${pair.label} pair...`);
			try {
				// Check if pair already exists
				const existingPair = await factory.getPair(pair.token0, pair.token1);
				if (existingPair !== hre.ethers.ZeroAddress) {
					console.log(`   ⚠️  Pair already exists: ${existingPair}`);
					createdPairs[pair.label] = existingPair;
					continue;
				}
				
				// Create the pair
				const tx = await factory.createPair(pair.token0, pair.token1, txGas);
				console.log(`   🧾 Creating pair... Hash: ${tx.hash}`);
				await tx.wait();
				
				// Get the created pair address
				const newPair = await factory.getPair(pair.token0, pair.token1);
				console.log(`   ✅ Pair created: ${newPair}`);
				createdPairs[pair.label] = newPair;
				
			} catch (error) {
				console.error(`   ❌ Failed to create ${pair.label}:`, error.message);
			}
		}
		
		// Step 2: Add pairs to oracle
		console.log("\n🔗 Step 2: Adding pairs to oracle...");
		
		for (const [label, pairAddress] of Object.entries(createdPairs)) {
			if (!pairAddress) continue;
			
			console.log(`\n📊 Adding ${label} to oracle...`);
			try {
				// Check if already supported
				const isSupported = await oracle.isPairSupported(pairAddress);
				if (isSupported) {
					console.log(`   ⚠️  Already supported by oracle`);
					continue;
				}
				
				// Find the pair info to get token0 and token1
				const pairInfo = pairs.find(p => p.label === label);
				if (!pairInfo) continue;
				
				// Add to oracle
				const tx = await oracle.addPair(pairAddress, pairInfo.token0, pairInfo.token1, txGas);
				console.log(`   🧾 Adding to oracle... Hash: ${tx.hash}`);
				await tx.wait();
				console.log(`   ✅ Added to oracle successfully`);
				
			} catch (error) {
				console.error(`   ❌ Failed to add ${label} to oracle:`, error.message);
			}
		}
		
		console.log("\n🎉 Process complete!");
		console.log("\n📋 Summary of created pairs:");
		for (const [label, address] of Object.entries(createdPairs)) {
			console.log(`   ${label}: ${address}`);
		}
		
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

