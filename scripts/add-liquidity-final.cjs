const { ethers } = require("hardhat");

async function main() {
    console.log("💧 Adding Liquidity to All 3 Pairs - Final Attempt...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Use the existing working router
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Liquidity amounts as requested
    const SHAH_USDT_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const USDT_AMOUNT = ethers.parseUnits("21", 6); // 21 USDT
    const SHAH_ETH_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const ETH_AMOUNT = ethers.parseEther("0.00448"); // 0.00448 ETH
    const SHAH_DAI_AMOUNT = ethers.parseEther("4"); // 4 SHAH
    const DAI_AMOUNT = ethers.parseEther("12"); // 12 DAI

    const deadline = 1757763300; // As requested

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
    console.log("\n📊 Current balances:");
    const shahBalance = await shah.balanceOf(await deployer.getAddress());
    const usdtBalance = await usdt.balanceOf(await deployer.getAddress());
    const daiBalance = await dai.balanceOf(await deployer.getAddress());
    const ethBalance = await deployer.provider.getBalance(await deployer.getAddress());

    console.log("  SHAH:", ethers.formatEther(shahBalance));
    console.log("  USDT:", ethers.formatUnits(usdtBalance, 6));
    console.log("  DAI:", ethers.formatEther(daiBalance));
    console.log("  ETH:", ethers.formatEther(ethBalance));

    const liquidityResults = [];

    try {
        // 1. Add SHAH/USDT liquidity
        console.log("\n💧 Adding SHAH/USDT liquidity...");
        
        console.log("  Approving SHAH...");
        const shahUsdtApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, SHAH_USDT_AMOUNT);
        await shahUsdtApproveTx.wait();
        
        console.log("  Approving USDT...");
        const usdtApproveTx = await usdt.approve(ROUTER_VS3_ADDRESS, USDT_AMOUNT);
        await usdtApproveTx.wait();

        console.log("  Adding liquidity...");
        const addUsdtLiquidityTx = await router.addLiquidity(
            SHAH_ADDRESS,
            USDT_ADDRESS,
            SHAH_USDT_AMOUNT,
            USDT_AMOUNT,
            (SHAH_USDT_AMOUNT * 95n) / 100n, // 5% slippage
            (USDT_AMOUNT * 95n) / 100n, // 5% slippage
            await deployer.getAddress(),
            deadline
        );
        await addUsdtLiquidityTx.wait();
        console.log("  ✅ SHAH/USDT liquidity added! Tx:", addUsdtLiquidityTx.hash);
        
        liquidityResults.push({
            pair: "SHAH/USDT",
            txHash: addUsdtLiquidityTx.hash,
            amounts: {
                shah: ethers.formatEther(SHAH_USDT_AMOUNT),
                usdt: ethers.formatUnits(USDT_AMOUNT, 6)
            }
        });

    } catch (error) {
        console.log("  ❌ SHAH/USDT failed:", error.message);
    }

    try {
        // 2. Add SHAH/ETH liquidity
        console.log("\n💧 Adding SHAH/ETH liquidity...");
        
        console.log("  Approving SHAH...");
        const shahEthApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, SHAH_ETH_AMOUNT);
        await shahEthApproveTx.wait();

        console.log("  Adding liquidity...");
        const addEthLiquidityTx = await router.addLiquidityETH(
            SHAH_ADDRESS,
            SHAH_ETH_AMOUNT,
            (SHAH_ETH_AMOUNT * 95n) / 100n, // 5% slippage
            (ETH_AMOUNT * 95n) / 100n, // 5% slippage
            await deployer.getAddress(),
            deadline,
            { value: ETH_AMOUNT }
        );
        await addEthLiquidityTx.wait();
        console.log("  ✅ SHAH/ETH liquidity added! Tx:", addEthLiquidityTx.hash);
        
        liquidityResults.push({
            pair: "SHAH/ETH",
            txHash: addEthLiquidityTx.hash,
            amounts: {
                shah: ethers.formatEther(SHAH_ETH_AMOUNT),
                eth: ethers.formatEther(ETH_AMOUNT)
            }
        });

    } catch (error) {
        console.log("  ❌ SHAH/ETH failed:", error.message);
    }

    try {
        // 3. Add SHAH/DAI liquidity
        console.log("\n💧 Adding SHAH/DAI liquidity...");
        
        console.log("  Approving SHAH...");
        const shahDaiApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, SHAH_DAI_AMOUNT);
        await shahDaiApproveTx.wait();
        
        console.log("  Approving DAI...");
        const daiApproveTx = await dai.approve(ROUTER_VS3_ADDRESS, DAI_AMOUNT);
        await daiApproveTx.wait();

        console.log("  Adding liquidity...");
        const addDaiLiquidityTx = await router.addLiquidity(
            SHAH_ADDRESS,
            DAI_ADDRESS,
            SHAH_DAI_AMOUNT,
            DAI_AMOUNT,
            (SHAH_DAI_AMOUNT * 95n) / 100n, // 5% slippage
            (DAI_AMOUNT * 95n) / 100n, // 5% slippage
            await deployer.getAddress(),
            deadline
        );
        await addDaiLiquidityTx.wait();
        console.log("  ✅ SHAH/DAI liquidity added! Tx:", addDaiLiquidityTx.hash);
        
        liquidityResults.push({
            pair: "SHAH/DAI",
            txHash: addDaiLiquidityTx.hash,
            amounts: {
                shah: ethers.formatEther(SHAH_DAI_AMOUNT),
                dai: ethers.formatEther(DAI_AMOUNT)
            }
        });

    } catch (error) {
        console.log("  ❌ SHAH/DAI failed:", error.message);
    }

    console.log("\n🎉 Liquidity addition completed!");
    console.log("📋 Results:");
    liquidityResults.forEach(result => {
        console.log(`  ${result.pair}: ${JSON.stringify(result.amounts)}`);
        console.log(`    Tx: ${result.txHash}`);
    });

    if (liquidityResults.length === 0) {
        console.log("\n⚠️ No liquidity was added. This is likely due to the phantom pair issue.");
        console.log("💡 The pairs exist in the factory but no contracts are deployed at those addresses.");
        console.log("🔧 Solution: Deploy new factory and router contracts with proper CREATE2 pair deployment.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });