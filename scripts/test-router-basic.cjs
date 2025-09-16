const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Basic Router Functions...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Contract addresses
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75";
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    // Get contracts
    const router = await ethers.getContractAt("ShahSwapRouterVS3", ROUTER_VS3_ADDRESS);
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);
    const shah = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH_ADDRESS);
    const usdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT_ADDRESS);

    console.log("\n🔍 Testing Router Configuration:");
    console.log("  Factory:", await router.factory());
    console.log("  WETH:", await router.WETH());
    console.log("  Oracle:", await router.oracle());

    console.log("\n🔍 Testing Factory:");
    const pairAddress = await factory.getPair(SHAH_ADDRESS, USDT_ADDRESS);
    console.log("  SHAH/USDT Pair:", pairAddress);

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
        console.log("  📝 Pair doesn't exist yet - this is expected");
    } else {
        console.log("  ✅ Pair exists");
        
        // Try to get reserves
        try {
            const pair = await ethers.getContractAt("contracts/interfaces/IShahSwapPair.sol:IShahSwapPair", pairAddress);
            const reserves = await pair.getReserves();
            console.log("  📊 Reserves:", ethers.formatEther(reserves[0]), "SHAH,", ethers.formatUnits(reserves[1], 6), "USDT");
        } catch (error) {
            console.log("  ⚠️ Could not get reserves:", error.message);
        }
    }

    console.log("\n🔍 Testing Quote Functions:");
    try {
        // Test quote function
        const quote = await router.quote(
            ethers.parseEther("1"), // 1 SHAH
            ethers.parseEther("1000"), // 1000 SHAH reserve
            ethers.parseUnits("3000", 6) // 3000 USDT reserve
        );
        console.log("  📊 Quote 1 SHAH for 3000 USDT reserve:", ethers.formatUnits(quote, 6), "USDT");
    } catch (error) {
        console.log("  ❌ Quote failed:", error.message);
    }

    console.log("\n🔍 Testing getAmountsOut:");
    try {
        const path = [SHAH_ADDRESS, USDT_ADDRESS];
        const amountsOut = await router.getAmountsOut(ethers.parseEther("1"), path);
        console.log("  📊 1 SHAH → USDT:", ethers.formatUnits(amountsOut[1], 6), "USDT");
    } catch (error) {
        console.log("  ❌ getAmountsOut failed:", error.message);
    }

    console.log("\n🎉 Basic router testing completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
