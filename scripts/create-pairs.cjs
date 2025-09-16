const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔗 Creating ShahSwap pairs...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment file not found. Run deploy-dex-v3.cjs first.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const factoryAddress = deploymentInfo.contracts.ShahSwapFactoryV3.address;
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    
    // Connect to factory
    const factory = await ethers.getContractAt("ShahSwapFactoryV3", factoryAddress);
    
    // Token addresses (Mainnet)
    const SHAH = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    
    console.log("\n📋 Token addresses:");
    console.log("SHAH:", SHAH);
    console.log("WETH:", WETH);
    console.log("USDT:", USDT);
    console.log("DAI:", DAI);
    
    const pairs = [];
    
    // Create pairs in order
    const pairConfigs = [
        { name: "SHAH/USDT", tokenA: SHAH, tokenB: USDT },
        { name: "SHAH/WETH", tokenA: SHAH, tokenB: WETH },
        { name: "SHAH/DAI", tokenA: SHAH, tokenB: DAI }
    ];
    
    for (const config of pairConfigs) {
        console.log(`\n🔗 Creating ${config.name} pair...`);
        
        // Check if pair already exists
        const existingPair = await factory.getPair(config.tokenA, config.tokenB);
        if (existingPair !== ethers.ZeroAddress) {
            console.log(`⚠️  Pair ${config.name} already exists at:`, existingPair);
            
            // Verify the pair has code
            const code = await ethers.provider.getCode(existingPair);
            if (code === "0x") {
                console.log("❌ Pair exists but has no code (phantom pair)!");
                throw new Error(`Phantom pair detected for ${config.name}`);
            } else {
                console.log("✅ Pair has valid code");
                pairs.push({
                    name: config.name,
                    address: existingPair,
                    tokenA: config.tokenA,
                    tokenB: config.tokenB
                });
            }
        } else {
            // Create the pair
            const tx = await factory.createPair(config.tokenA, config.tokenB);
            console.log("📝 Transaction hash:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ Pair created in block:", receipt.blockNumber);
            
            // Get the pair address
            const pairAddress = await factory.getPair(config.tokenA, config.tokenB);
            console.log("📍 Pair address:", pairAddress);
            
            // Verify the pair has code
            const code = await ethers.provider.getCode(pairAddress);
            if (code === "0x") {
                throw new Error(`Failed to deploy pair contract for ${config.name}`);
            } else {
                console.log("✅ Pair contract deployed successfully");
            }
            
            pairs.push({
                name: config.name,
                address: pairAddress,
                tokenA: config.tokenA,
                tokenB: config.tokenB
            });
        }
    }
    
    // Save pair info
    const pairInfo = {
        network: "mainnet",
        timestamp: new Date().toISOString(),
        factory: factoryAddress,
        pairs: pairs
    };
    
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    fs.writeFileSync(pairPath, JSON.stringify(pairInfo, null, 2));
    console.log("\n💾 Pair info saved to:", pairPath);
    
    console.log("\n🎉 All pairs created successfully!");
    console.log("\n📋 Pair Summary:");
    pairs.forEach(pair => {
        console.log(`${pair.name}: ${pair.address}`);
    });
    
    console.log("\nNext steps:");
    console.log("1. npm run dex:seed");
    console.log("2. npm run dex:oracle");
    console.log("3. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Pair creation failed:", error);
        process.exit(1);
    });