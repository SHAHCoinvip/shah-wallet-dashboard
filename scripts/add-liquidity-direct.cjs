const { ethers } = require("hardhat");

async function main() {
    console.log("💧 Adding Liquidity Directly to Existing Pairs...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Contract addresses
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Liquidity amounts
    const SHAH_USDT_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const USDT_AMOUNT = ethers.parseUnits("21", 6); // 21 USDT
    const SHAH_ETH_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const ETH_AMOUNT = ethers.parseEther("0.00448"); // 0.00448 ETH
    const SHAH_DAI_AMOUNT = ethers.parseEther("4"); // 4 SHAH
    const DAI_AMOUNT = ethers.parseEther("12"); // 12 DAI

    const deadline = 1757763300;

    console.log("🎯 Liquidity Amounts:");
    console.log("  SHAH/USDT: 7 SHAH + 21 USDT");
    console.log("  SHAH/ETH: 7 SHAH + 0.00448 ETH");
    console.log("  SHAH/DAI: 4 SHAH + 12 DAI");

    // Get contracts
    const router = await ethers.getContractAt("ShahSwapRouterVS3", ROUTER_VS3_ADDRESS);
    const shah = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH_ADDRESS);
    const usdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT_ADDRESS);
    const dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI_ADDRESS);

    // Check balances
    console.log("\n📊 Current Balances:");
    const shahBalance = await shah.balanceOf(await deployer.getAddress());
    const usdtBalance = await usdt.balanceOf(await deployer.getAddress());
    const daiBalance = await dai.balanceOf(await deployer.getAddress());
    const ethBalance = await deployer.provider.getBalance(await deployer.getAddress());

    console.log("  SHAH:", ethers.formatEther(shahBalance));
    console.log("  USDT:", ethers.formatUnits(usdtBalance, 6));
    console.log("  DAI:", ethers.formatEther(daiBalance));
    console.log("  ETH:", ethers.formatEther(ethBalance));

    try {
        // Try a different approach - let's try to add liquidity with very small amounts first
        console.log("\n🔄 Trying with minimal amounts first...");
        
        const MIN_SHAH = ethers.parseEther("0.001");
        const MIN_USDT = ethers.parseUnits("0.001", 6);
        const MIN_DAI = ethers.parseEther("0.001");
        const MIN_ETH = ethers.parseEther("0.0001");

        // Try SHAH/USDT with minimal amounts
        console.log("\n🔄 Testing SHAH/USDT with minimal amounts...");
        
        try {
            // Approve minimal amounts
            const shahApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, MIN_SHAH);
            await shahApproveTx.wait();
            console.log("  ✅ SHAH approved");
            
            const usdtApproveTx = await usdt.approve(ROUTER_VS3_ADDRESS, MIN_USDT);
            await usdtApproveTx.wait();
            console.log("  ✅ USDT approved");

            // Try to add minimal liquidity
            const addLiquidityTx = await router.addLiquidity(
                SHAH_ADDRESS,
                USDT_ADDRESS,
                MIN_SHAH,
                MIN_USDT,
                0, // No slippage protection for testing
                0, // No slippage protection for testing
                await deployer.getAddress(),
                deadline
            );
            await addLiquidityTx.wait();
            console.log("  ✅ Minimal liquidity added! Tx:", addLiquidityTx.hash);
            
            // If this works, try with the full amounts
            console.log("\n🔄 Now trying with full amounts...");
            
            // Approve full amounts
            const fullShahApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, SHAH_USDT_AMOUNT);
            await fullShahApproveTx.wait();
            
            const fullUsdtApproveTx = await usdt.approve(ROUTER_VS3_ADDRESS, USDT_AMOUNT);
            await fullUsdtApproveTx.wait();

            // Add full liquidity
            const fullAddLiquidityTx = await router.addLiquidity(
                SHAH_ADDRESS,
                USDT_ADDRESS,
                SHAH_USDT_AMOUNT,
                USDT_AMOUNT,
                (SHAH_USDT_AMOUNT * 95n) / 100n, // 5% slippage
                (USDT_AMOUNT * 95n) / 100n, // 5% slippage
                await deployer.getAddress(),
                deadline
            );
            await fullAddLiquidityTx.wait();
            console.log("  ✅ Full SHAH/USDT liquidity added! Tx:", fullAddLiquidityTx.hash);
            
        } catch (error) {
            console.log("  ❌ SHAH/USDT failed:", error.message);
        }

    } catch (error) {
        console.error("❌ Error in direct liquidity addition:", error);
    }

    console.log("\n🎉 Direct liquidity addition attempt completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
