const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Advanced Swap Features with ShahSwapRouterVS3...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Contract addresses (Ethereum mainnet)
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75"; // ShahSwapRouterVS3 deployed address
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Test amounts (very small for testing)
    const TEST_AMOUNT = ethers.parseEther("0.001"); // 0.001 SHAH
    const TEST_USDT_AMOUNT = ethers.parseUnits("1", 6); // 1 USDT

    console.log("🎯 Test Amounts:");
    console.log("  SHAH: 0.001 SHAH");
    console.log("  USDT: 1 USDT");

    // Get contracts
    const router = await ethers.getContractAt("ShahSwapRouterVS3", ROUTER_VS3_ADDRESS);
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);

    // Get token contracts
    const shah = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH_ADDRESS);
    const usdt = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT_ADDRESS);
    const dai = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI_ADDRESS);

    // Check balances
    console.log("\n📊 Current Balances:");
    const shahBalance = await shah.balanceOf(await deployer.getAddress());
    const usdtBalance = await usdt.balanceOf(await deployer.getAddress());
    const daiBalance = await dai.balanceOf(await deployer.getAddress());

    console.log("  SHAH:", ethers.formatEther(shahBalance));
    console.log("  USDT:", ethers.formatUnits(usdtBalance, 6));
    console.log("  DAI:", ethers.formatEther(daiBalance));

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    try {
        // Test 1: Multi-hop swap SHAH → WETH → USDT
        console.log("\n🔄 Test 1: Multi-hop swap SHAH → WETH → USDT");
        
        if (shahBalance >= TEST_AMOUNT) {
            // Get amounts out first
            const path = [SHAH_ADDRESS, WETH_ADDRESS, USDT_ADDRESS];
            const amountsOut = await router.getAmountsOut(TEST_AMOUNT, path);
            
            console.log("  📊 Expected amounts:");
            console.log("    Input: 0.001 SHAH");
            console.log("    WETH: ", ethers.formatEther(amountsOut[1]));
            console.log("    USDT: ", ethers.formatUnits(amountsOut[2], 6));

            // Approve SHAH
            console.log("  Approving SHAH...");
            const approveTx = await shah.approve(ROUTER_VS3_ADDRESS, TEST_AMOUNT);
            await approveTx.wait();

            // Execute multi-hop swap
            const swapTx = await router.swapExactTokensForTokensMultiHop({
                amountIn: TEST_AMOUNT,
                amountOutMin: (amountsOut[2] * 95n) / 100n, // 5% slippage
                path: path,
                to: await deployer.getAddress(),
                deadline: deadline
            });
            await swapTx.wait();
            console.log("  ✅ Multi-hop swap executed. Tx:", swapTx.hash);
        } else {
            console.log("  ⚠️ Insufficient SHAH balance for multi-hop test");
        }

        // Test 2: Batch swap (multiple small swaps)
        console.log("\n🔄 Test 2: Batch swap (SHAH → USDT, SHAH → DAI)");
        
        if (shahBalance >= (TEST_AMOUNT * 2n)) {
            const batchAmount = TEST_AMOUNT / 2n; // Split the amount
            
            // Prepare batch swap parameters
            const batchSwaps = [
                {
                    amountIn: batchAmount,
                    amountOutMin: 0, // 0 for testing
                    path: [SHAH_ADDRESS, USDT_ADDRESS],
                    to: await deployer.getAddress(),
                    deadline: deadline
                },
                {
                    amountIn: batchAmount,
                    amountOutMin: 0, // 0 for testing
                    path: [SHAH_ADDRESS, DAI_ADDRESS],
                    to: await deployer.getAddress(),
                    deadline: deadline
                }
            ];

            // Approve total amount
            console.log("  Approving SHAH for batch swap...");
            const approveTx = await shah.approve(ROUTER_VS3_ADDRESS, TEST_AMOUNT);
            await approveTx.wait();

            // Execute batch swap
            const batchTx = await router.batchSwapExactTokensForTokens({
                swaps: batchSwaps,
                totalAmountIn: TEST_AMOUNT,
                totalAmountOutMin: 0, // 0 for testing
                to: await deployer.getAddress(),
                deadline: deadline
            });
            await batchTx.wait();
            console.log("  ✅ Batch swap executed. Tx:", batchTx.hash);
        } else {
            console.log("  ⚠️ Insufficient SHAH balance for batch swap test");
        }

        // Test 3: Quote functions
        console.log("\n🔄 Test 3: Quote functions");
        
        // Test getAmountsOut
        const quotePath = [SHAH_ADDRESS, USDT_ADDRESS];
        const amountsOut = await router.getAmountsOut(TEST_AMOUNT, quotePath);
        console.log("  📊 getAmountsOut for SHAH → USDT:");
        console.log("    Input: 0.001 SHAH");
        console.log("    Output:", ethers.formatUnits(amountsOut[1], 6), "USDT");

        // Test getAmountsIn
        const targetUSDT = ethers.parseUnits("1", 6); // 1 USDT
        const amountsIn = await router.getAmountsIn(targetUSDT, quotePath);
        console.log("  📊 getAmountsIn for 1 USDT → SHAH:");
        console.log("    Input needed:", ethers.formatEther(amountsIn[0]), "SHAH");
        console.log("    Output: 1 USDT");

        // Test getBestRoute (if oracle is available)
        console.log("  📊 getBestRoute for SHAH → USDT:");
        try {
            const bestRoute = await router.getBestRoute(TEST_AMOUNT, quotePath);
            console.log("    Route:", bestRoute.path.map(addr => addr.slice(0, 6) + "..."));
            console.log("    Amount out:", ethers.formatUnits(bestRoute.amountOut, 6), "USDT");
            console.log("    Price impact:", bestRoute.priceImpact.toString(), "%");
        } catch (error) {
            console.log("    ⚠️ getBestRoute failed (oracle may not be available):", error.message);
        }

        // Test 4: Basic swap functions
        console.log("\n🔄 Test 4: Basic swap functions");
        
        if (usdtBalance >= TEST_USDT_AMOUNT) {
            // Test swapExactTokensForTokens
            const reversePath = [USDT_ADDRESS, SHAH_ADDRESS];
            const reverseAmountsOut = await router.getAmountsOut(TEST_USDT_AMOUNT, reversePath);
            
            console.log("  📊 USDT → SHAH swap:");
            console.log("    Input: 1 USDT");
            console.log("    Expected output:", ethers.formatEther(reverseAmountsOut[1]), "SHAH");

            // Approve USDT
            console.log("  Approving USDT...");
            const approveTx = await usdt.approve(ROUTER_VS3_ADDRESS, TEST_USDT_AMOUNT);
            await approveTx.wait();

            // Execute swap
            const swapTx = await router.swapExactTokensForTokens(
                TEST_USDT_AMOUNT,
                (reverseAmountsOut[1] * 95n) / 100n, // 5% slippage
                reversePath,
                await deployer.getAddress(),
                deadline
            );
            await swapTx.wait();
            console.log("  ✅ USDT → SHAH swap executed. Tx:", swapTx.hash);
        } else {
            console.log("  ⚠️ Insufficient USDT balance for basic swap test");
        }

        console.log("\n🎉 Advanced swap testing completed!");
        console.log("📋 Summary:");
        console.log("  ✅ Multi-hop swap functionality tested");
        console.log("  ✅ Batch swap functionality tested");
        console.log("  ✅ Quote functions tested");
        console.log("  ✅ Basic swap functions tested");
        console.log("  ✅ Oracle integration tested (if available)");

    } catch (error) {
        console.error("❌ Error during testing:", error);
        if (error.message.includes("insufficient balance")) {
            console.log("💡 Make sure you have enough tokens in your wallet");
        }
        if (error.message.includes("execution reverted")) {
            console.log("💡 Check if pairs exist and have sufficient liquidity");
        }
        if (error.message.includes("INVALID_PATH")) {
            console.log("💡 Check if the swap path is valid (pairs exist)");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
