const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 Debugging pair addresses...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    
    if (!fs.existsSync(deploymentPath) || !fs.existsSync(pairPath)) {
        throw new Error("Deployment files not found.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    
    const factoryAddress = deploymentInfo.contracts.ShahSwapFactoryV3.address;
    const routerAddress = deploymentInfo.contracts.ShahSwapRouterV3.address;
    const pairs = pairInfo.pairs;
    
    // Connect to contracts
    const factory = await ethers.getContractAt("ShahSwapFactoryV3", factoryAddress);
    const router = await ethers.getContractAt("ShahSwapRouterV3", routerAddress);
    
    // Token addresses
    const SHAH = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    
    console.log("\n📋 Comparing pair addresses:");
    
    for (const pair of pairs) {
        console.log(`\n🔍 ${pair.name}:`);
        console.log("Actual pair address:", pair.address);
        
        // Get pair from factory
        const factoryPair = await factory.getPair(pair.tokenA, pair.tokenB);
        console.log("Factory getPair:", factoryPair);
        
        // Check if they match
        if (factoryPair.toLowerCase() === pair.address.toLowerCase()) {
            console.log("✅ Factory pair matches actual pair");
        } else {
            console.log("❌ Factory pair does NOT match actual pair!");
        }
        
        // Check if router can find the pair
        try {
            // Try to get reserves (this will fail if router can't find the pair)
            const reserves = await router.getReserves(factoryAddress, pair.tokenA, pair.tokenB);
            console.log("✅ Router can access pair reserves");
        } catch (error) {
            console.log("❌ Router cannot access pair:", error.message);
        }
    }
    
    // Test router's pairFor function
    console.log("\n🧪 Testing router's pairFor function:");
    
    // Manually calculate what the router should return
    const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
    console.log("INIT_CODE_PAIR_HASH:", initCodeHash);
    
    for (const pair of pairs) {
        console.log(`\n🔍 ${pair.name} pairFor calculation:`);
        
        // Sort tokens
        const [token0, token1] = pair.tokenA < pair.tokenB ? [pair.tokenA, pair.tokenB] : [pair.tokenB, pair.tokenA];
        console.log("Token0:", token0);
        console.log("Token1:", token1);
        
        // Calculate CREATE2 address
        const salt = ethers.keccak256(ethers.solidityPacked(["address", "address"], [token0, token1]));
        console.log("Salt:", salt);
        
        // Calculate pair address using CREATE2
        const pairAddress = ethers.getCreate2Address(factoryAddress, salt, initCodeHash);
        console.log("Calculated pair address:", pairAddress);
        console.log("Actual pair address:", pair.address);
        
        if (pairAddress.toLowerCase() === pair.address.toLowerCase()) {
            console.log("✅ CREATE2 calculation matches actual pair");
        } else {
            console.log("❌ CREATE2 calculation does NOT match actual pair!");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug failed:", error);
        process.exit(1);
    });
