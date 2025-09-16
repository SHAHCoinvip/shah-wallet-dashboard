const { ethers } = require("hardhat");

async function main() {
    console.log("💧 Adding Liquidity to All 3 Pairs with ShahSwapRouterVS3...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
    }

    console.log("📋 Deployer:", await deployer.getAddress());
    console.log("💰 Balance:", ethers.formatEther(await deployer.provider.getBalance(await deployer.getAddress())), "ETH");

    // Contract addresses
    const ROUTER_VS3_ADDRESS = "0x16e9e54973C70D3C00d580A5A220E63317428D75"; // ShahSwapRouterVS3
    const FACTORY_ADDRESS = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
    const ORACLE_ADDRESS = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";
    
    // Token addresses
    const SHAH_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    // Liquidity amounts (hardcoded as requested)
    const SHAH_USDT_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const USDT_AMOUNT = ethers.parseUnits("21", 6); // 21 USDT (6 decimals)
    const SHAH_ETH_AMOUNT = ethers.parseEther("7"); // 7 SHAH
    const ETH_AMOUNT = ethers.parseEther("0.00448"); // 0.00448 ETH (~$21)
    const SHAH_DAI_AMOUNT = ethers.parseEther("4"); // 4 SHAH
    const DAI_AMOUNT = ethers.parseEther("12"); // 12 DAI

    // Deadline: 2025-09-13 11:30 UTC (Unix: 1757763300)
    const deadline = 1757763300;

    console.log("🎯 Liquidity Amounts:");
    console.log("  SHAH/USDT: 7 SHAH + 21 USDT");
    console.log("  SHAH/ETH: 7 SHAH + 0.00448 ETH");
    console.log("  SHAH/DAI: 4 SHAH + 12 DAI");
    console.log("  Deadline:", new Date(deadline * 1000).toISOString());

    // Get contracts
    const router = await ethers.getContractAt("ShahSwapRouterVS3", ROUTER_VS3_ADDRESS);
    const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY_ADDRESS);
    const oracle = await ethers.getContractAt("contracts/interfaces/IOracle.sol:IOracle", ORACLE_ADDRESS);

    // Get token contracts
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

    // Check if we have enough balance
    const totalShahNeeded = SHAH_USDT_AMOUNT + SHAH_ETH_AMOUNT + SHAH_DAI_AMOUNT;
    if (shahBalance < totalShahNeeded) {
        console.log("❌ Insufficient SHAH balance. Need:", ethers.formatEther(totalShahNeeded));
        return;
    }
    if (usdtBalance < USDT_AMOUNT) {
        console.log("❌ Insufficient USDT balance. Need:", ethers.formatUnits(USDT_AMOUNT, 6));
        return;
    }
    if (daiBalance < DAI_AMOUNT) {
        console.log("❌ Insufficient DAI balance. Need:", ethers.formatEther(DAI_AMOUNT));
        return;
    }
    if (ethBalance < ETH_AMOUNT) {
        console.log("❌ Insufficient ETH balance. Need:", ethers.formatEther(ETH_AMOUNT));
        return;
    }

    try {
        // 1. Add SHAH/USDT liquidity
        console.log("\n🔄 Adding SHAH/USDT liquidity...");
        
        // Approve tokens
        console.log("  Approving SHAH...");
        const shahApproveTx = await shah.approve(ROUTER_VS3_ADDRESS, SHAH_USDT_AMOUNT);
        await shahApproveTx.wait();
        
        console.log("  Approving USDT...");
        const usdtApproveTx = await usdt.approve(ROUTER_VS3_ADDRESS, USDT_AMOUNT);
        await usdtApproveTx.wait();

        // Add liquidity
        const addLiquidityTx = await router.addLiquidity(
            SHAH_ADDRESS,
            USDT_ADDRESS,
            SHAH_USDT_AMOUNT,
            USDT_AMOUNT,
            (SHAH_USDT_AMOUNT * 95n) / 100n, // 5% slippage
            (USDT_AMOUNT * 95n) / 100n, // 5% slippage
            await deployer.getAddress(),
            deadline
        );
        await addLiquidityTx.wait();
        console.log("  ✅ SHAH/USDT liquidity added. Tx:", addLiquidityTx.hash);

        // Get pair address and register in oracle
        const shahUsdtPair = await factory.getPair(SHAH_ADDRESS, USDT_ADDRESS);
        console.log("  📍 SHAH/USDT Pair:", shahUsdtPair);
        
        try {
            const oracleTx = await oracle.addPair(shahUsdtPair);
            await oracleTx.wait();
            console.log("  ✅ SHAH/USDT pair registered in Oracle. Tx:", oracleTx.hash);
        } catch (error) {
            console.log("  ⚠️ Oracle registration failed:", error.message);
        }

        // 2. Add SHAH/ETH liquidity
        console.log("\n🔄 Adding SHAH/ETH liquidity...");
        
        // Add liquidity with ETH
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
        console.log("  ✅ SHAH/ETH liquidity added. Tx:", addEthLiquidityTx.hash);

        // Get pair address and register in oracle
        const shahEthPair = await factory.getPair(SHAH_ADDRESS, WETH_ADDRESS);
        console.log("  📍 SHAH/ETH Pair:", shahEthPair);
        
        try {
            const oracleTx = await oracle.addPair(shahEthPair);
            await oracleTx.wait();
            console.log("  ✅ SHAH/ETH pair registered in Oracle. Tx:", oracleTx.hash);
        } catch (error) {
            console.log("  ⚠️ Oracle registration failed:", error.message);
        }

        // 3. Add SHAH/DAI liquidity
        console.log("\n🔄 Adding SHAH/DAI liquidity...");
        
        // Approve DAI
        console.log("  Approving DAI...");
        const daiApproveTx = await dai.approve(ROUTER_VS3_ADDRESS, DAI_AMOUNT);
        await daiApproveTx.wait();

        // Add liquidity
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
        console.log("  ✅ SHAH/DAI liquidity added. Tx:", addDaiLiquidityTx.hash);

        // Get pair address and register in oracle
        const shahDaiPair = await factory.getPair(SHAH_ADDRESS, DAI_ADDRESS);
        console.log("  📍 SHAH/DAI Pair:", shahDaiPair);
        
        try {
            const oracleTx = await oracle.addPair(shahDaiPair);
            await oracleTx.wait();
            console.log("  ✅ SHAH/DAI pair registered in Oracle. Tx:", oracleTx.hash);
        } catch (error) {
            console.log("  ⚠️ Oracle registration failed:", error.message);
        }

        console.log("\n🎉 All liquidity added successfully!");
        console.log("📋 Summary:");
        console.log("  SHAH/USDT Pair:", shahUsdtPair);
        console.log("  SHAH/ETH Pair:", shahEthPair);
        console.log("  SHAH/DAI Pair:", shahDaiPair);
        console.log("  Total SHAH used:", ethers.formatEther(totalShahNeeded));
        console.log("  Total USDT used:", ethers.formatUnits(USDT_AMOUNT, 6));
        console.log("  Total DAI used:", ethers.formatEther(DAI_AMOUNT));
        console.log("  Total ETH used:", ethers.formatEther(ETH_AMOUNT));

    } catch (error) {
        console.error("❌ Error adding liquidity:", error);
        if (error.message.includes("insufficient balance")) {
            console.log("💡 Make sure you have enough tokens in your wallet");
        }
        if (error.message.includes("execution reverted")) {
            console.log("💡 Check if pairs exist and have sufficient reserves");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
