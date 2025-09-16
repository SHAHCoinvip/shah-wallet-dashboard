const { ethers } = require("hardhat");

async function main() {
    console.log("🔄 Trying with Old ShahSwapRouterV2...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());

    // Contract addresses
    const OLD_ROUTER_ADDRESS = "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C"; // ShahSwapRouterV2
    const NEW_ROUTER_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75"; // ShahSwapRouterVS3
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    // Minimal test amounts
    const MIN_SHAH = ethers.parseEther("0.001");
    const MIN_USDT = ethers.parseUnits("0.001", 6);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    console.log("🎯 Testing with minimal amounts:");
    console.log("  SHAH:", ethers.formatEther(MIN_SHAH));
    console.log("  USDT:", ethers.formatUnits(MIN_USDT, 6));

    // Get contracts
    const oldRouter = await ethers.getContractAt("ShahSwapRouterV2", OLD_ROUTER_ADDRESS);
    const shah = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH_ADDRESS);
    const usdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT_ADDRESS);

    try {
        console.log("\n🔄 Testing with Old Router (ShahSwapRouterV2)...");
        
        // Check if old router has liquidity functions
        console.log("  Checking old router functions...");
        
        // Try to call a basic function first
        try {
            const factory = await oldRouter.factory();
            console.log("  ✅ Old router factory:", factory);
        } catch (error) {
            console.log("  ❌ Old router factory check failed:", error.message);
        }

        // Try to approve tokens for old router
        console.log("  Approving tokens for old router...");
        const shahApproveTx = await shah.approve(OLD_ROUTER_ADDRESS, MIN_SHAH);
        await shahApproveTx.wait();
        console.log("  ✅ SHAH approved for old router");
        
        const usdtApproveTx = await usdt.approve(OLD_ROUTER_ADDRESS, MIN_USDT);
        await usdtApproveTx.wait();
        console.log("  ✅ USDT approved for old router");

        // Try to add liquidity with old router
        console.log("  Attempting to add liquidity with old router...");
        const addLiquidityTx = await oldRouter.addLiquidity(
            SHAH_ADDRESS,
            USDT_ADDRESS,
            MIN_SHAH,
            MIN_USDT,
            0, // No slippage protection
            0, // No slippage protection
            await deployer.getAddress(),
            deadline
        );
        await addLiquidityTx.wait();
        console.log("  ✅ Old router liquidity added! Tx:", addLiquidityTx.hash);
        
    } catch (error) {
        console.log("  ❌ Old router failed:", error.message);
        
        // Check if old router has addLiquidity function
        try {
            const hasAddLiquidity = await oldRouter.addLiquidity.staticCall(
                SHAH_ADDRESS,
                USDT_ADDRESS,
                MIN_SHAH,
                MIN_USDT,
                0,
                0,
                await deployer.getAddress(),
                deadline
            );
            console.log("  📊 Old router addLiquidity would return:", hasAddLiquidity);
        } catch (staticError) {
            console.log("  ❌ Old router addLiquidity static call failed:", staticError.message);
        }
    }

    console.log("\n🎉 Old router test completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
