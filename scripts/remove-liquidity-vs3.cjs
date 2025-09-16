const { ethers } = require("hardhat");

async function main() {
    console.log("💧 Removing Test Liquidity with ShahSwapRouterVS3...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", deployer.address);
    console.log("💰 Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

    // Contract addresses (Ethereum mainnet)
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75"; // ShahSwapRouterVS3 deployed address
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Test amounts to remove (small amounts for testing)
    const REMOVE_LIQUIDITY_AMOUNT = ethers.utils.parseEther("0.001"); // Remove 0.001 LP tokens

    console.log("🎯 Removing Test Liquidity Amounts:");
    console.log("  Each pair: 0.001 LP tokens");

    // Get contracts
    const router = await ethers.getContractAt("ShahSwapRouterVS3", ROUTER_VS3_ADDRESS);
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);

    // Get pair addresses
    const shahUsdtPair = await factory.getPair(SHAH_ADDRESS, USDT_ADDRESS);
    const shahDaiPair = await factory.getPair(SHAH_ADDRESS, DAI_ADDRESS);
    const shahEthPair = await factory.getPair(SHAH_ADDRESS, WETH_ADDRESS);

    console.log("📍 Pair Addresses:");
    console.log("  SHAH/USDT:", shahUsdtPair);
    console.log("  SHAH/DAI:", shahDaiPair);
    console.log("  SHAH/ETH:", shahEthPair);

    // Get LP token contracts
    const shahUsdtLp = await ethers.getContractAt("IERC20", shahUsdtPair);
    const shahDaiLp = await ethers.getContractAt("IERC20", shahDaiPair);
    const shahEthLp = await ethers.getContractAt("IERC20", shahEthPair);

    // Check LP token balances
    console.log("\n📊 Current LP Token Balances:");
    const shahUsdtLpBalance = await shahUsdtLp.balanceOf(deployer.address);
    const shahDaiLpBalance = await shahDaiLp.balanceOf(deployer.address);
    const shahEthLpBalance = await shahEthLp.balanceOf(deployer.address);

    console.log("  SHAH/USDT LP:", ethers.utils.formatEther(shahUsdtLpBalance));
    console.log("  SHAH/DAI LP:", ethers.utils.formatEther(shahDaiLpBalance));
    console.log("  SHAH/ETH LP:", ethers.utils.formatEther(shahEthLpBalance));

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    try {
        // 1. Remove SHAH/USDT liquidity
        if (shahUsdtLpBalance.gte(REMOVE_LIQUIDITY_AMOUNT)) {
            console.log("\n🔄 Removing SHAH/USDT liquidity...");
            
            // Approve LP tokens
            console.log("  Approving SHAH/USDT LP tokens...");
            const approveTx = await shahUsdtLp.approve(ROUTER_VS3_ADDRESS, REMOVE_LIQUIDITY_AMOUNT);
            await approveTx.wait();

            // Remove liquidity
            const removeTx = await router.removeLiquidity(
                SHAH_ADDRESS,
                USDT_ADDRESS,
                REMOVE_LIQUIDITY_AMOUNT,
                0, // amountAMin (0 for testing)
                0, // amountBMin (0 for testing)
                deployer.address,
                deadline
            );
            await removeTx.wait();
            console.log("  ✅ SHAH/USDT liquidity removed. Tx:", removeTx.hash);
        } else {
            console.log("  ⚠️ Insufficient SHAH/USDT LP tokens to remove");
        }

        // 2. Remove SHAH/DAI liquidity
        if (shahDaiLpBalance.gte(REMOVE_LIQUIDITY_AMOUNT)) {
            console.log("\n🔄 Removing SHAH/DAI liquidity...");
            
            // Approve LP tokens
            console.log("  Approving SHAH/DAI LP tokens...");
            const approveTx = await shahDaiLp.approve(ROUTER_VS3_ADDRESS, REMOVE_LIQUIDITY_AMOUNT);
            await approveTx.wait();

            // Remove liquidity
            const removeTx = await router.removeLiquidity(
                SHAH_ADDRESS,
                DAI_ADDRESS,
                REMOVE_LIQUIDITY_AMOUNT,
                0, // amountAMin (0 for testing)
                0, // amountBMin (0 for testing)
                deployer.address,
                deadline
            );
            await removeTx.wait();
            console.log("  ✅ SHAH/DAI liquidity removed. Tx:", removeTx.hash);
        } else {
            console.log("  ⚠️ Insufficient SHAH/DAI LP tokens to remove");
        }

        // 3. Remove SHAH/ETH liquidity
        if (shahEthLpBalance.gte(REMOVE_LIQUIDITY_AMOUNT)) {
            console.log("\n🔄 Removing SHAH/ETH liquidity...");
            
            // Approve LP tokens
            console.log("  Approving SHAH/ETH LP tokens...");
            const approveTx = await shahEthLp.approve(ROUTER_VS3_ADDRESS, REMOVE_LIQUIDITY_AMOUNT);
            await approveTx.wait();

            // Remove liquidity with ETH
            const removeTx = await router.removeLiquidityETH(
                SHAH_ADDRESS,
                REMOVE_LIQUIDITY_AMOUNT,
                0, // amountTokenMin (0 for testing)
                0, // amountETHMin (0 for testing)
                deployer.address,
                deadline
            );
            await removeTx.wait();
            console.log("  ✅ SHAH/ETH liquidity removed. Tx:", removeTx.hash);
        } else {
            console.log("  ⚠️ Insufficient SHAH/ETH LP tokens to remove");
        }

        console.log("\n🎉 Liquidity removal completed!");
        console.log("📋 Summary:");
        console.log("  Removed small amounts of liquidity from all pairs");
        console.log("  Tokens returned to your wallet");

    } catch (error) {
        console.error("❌ Error removing liquidity:", error);
        if (error.message.includes("insufficient balance")) {
            console.log("💡 Make sure you have LP tokens in your wallet");
        }
        if (error.message.includes("execution reverted")) {
            console.log("💡 Check if pairs exist and have sufficient liquidity");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
