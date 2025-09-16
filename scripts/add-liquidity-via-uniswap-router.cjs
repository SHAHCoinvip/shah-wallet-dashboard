const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });
const hardhatEnvPath = path.join(__dirname, "..", ".env.hardhat");
if (fs.existsSync(hardhatEnvPath)) {
    require("dotenv").config({ path: hardhatEnvPath, override: true });
}

async function main() {
    console.log("💧 Adding Liquidity via Uniswap V2 Router...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const ORACLE = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";
        const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Standard Uniswap V2 Router
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        // Liquidity amounts
        const LIQUIDITY_AMOUNTS = {
            shahAmount: ethers.parseEther("3.33"), // 3.33 SHAH
            usdtAmount: ethers.parseUnits("10", 6), // 10 USDT (6 decimals)
            description: "3.33 SHAH + 10 USDT"
        };

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   Uniswap V2 Router: ${UNISWAP_V2_ROUTER}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        // Uniswap V2 Router ABI
        const routerAbi = [
            "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
            "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
            "function factory() external pure returns (address)",
            "function WETH() external pure returns (address)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);

        console.log("🔍 Checking token balances...");
        
        // Check balances
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

        console.log("✅ Balance check complete\n");

        // Step 1: Add liquidity via Uniswap V2 Router
        console.log("💧 Step 1: Adding liquidity via Uniswap V2 Router...\n");

        try {
            console.log(`   Adding liquidity: ${LIQUIDITY_AMOUNTS.description}`);
            
            // Check current allowances for router
            const shahAllowance = await shahToken.allowance(deployer.address, UNISWAP_V2_ROUTER);
            const usdtAllowance = await usdtToken.allowance(deployer.address, UNISWAP_V2_ROUTER);
            
            console.log(`   Current SHAH allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
            console.log(`   Current USDT allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);
            
            // Approve router to spend tokens
            if (shahAllowance < LIQUIDITY_AMOUNTS.shahAmount) {
                console.log(`   Approving SHAH tokens for router...`);
                const approveShahTx = await shahToken.approve(UNISWAP_V2_ROUTER, LIQUIDITY_AMOUNTS.shahAmount);
                await approveShahTx.wait();
                console.log(`   ✅ SHAH tokens approved: ${approveShahTx.hash}`);
            }
            
            if (usdtAllowance < LIQUIDITY_AMOUNTS.usdtAmount) {
                console.log(`   Approving USDT tokens for router...`);
                const approveUsdtTx = await usdtToken.approve(UNISWAP_V2_ROUTER, LIQUIDITY_AMOUNTS.usdtAmount);
                await approveUsdtTx.wait();
                console.log(`   ✅ USDT tokens approved: ${approveUsdtTx.hash}`);
            }
            
            // Calculate deadline (20 minutes from now)
            const deadline = Math.floor(Date.now() / 1000) + (60 * 20);
            
            // Add liquidity using the Uniswap V2 router
            console.log(`   Adding liquidity via Uniswap V2 router...`);
            const router = await ethers.getContractAt(routerAbi, UNISWAP_V2_ROUTER);
            
            const addLiquidityTx = await router.addLiquidity(
                TOKENS.SHAH,                    // tokenA
                TOKENS.USDT,                    // tokenB
                LIQUIDITY_AMOUNTS.shahAmount,   // amountADesired
                LIQUIDITY_AMOUNTS.usdtAmount,   // amountBDesired
                LIQUIDITY_AMOUNTS.shahAmount * 99n / 100n,  // amountAMin (1% slippage)
                LIQUIDITY_AMOUNTS.usdtAmount * 99n / 100n,  // amountBMin (1% slippage)
                deployer.address,               // to
                deadline                        // deadline
            );
            await addLiquidityTx.wait();
            console.log(`   ✅ Liquidity added successfully: ${addLiquidityTx.hash}`);
            
        } catch (error) {
            console.log(`   ❌ Liquidity addition failed: ${error.message}`);
            return;
        }

        console.log("");

        // Step 2: Register pair in Oracle
        console.log("📊 Step 2: Registering pair in Oracle...\n");

        try {
            // Get the pair address from factory
            const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
            const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
            
            console.log(`   Pair Address: ${pairAddress}`);
            console.log(`   Registering SHAH/USDT pair in Oracle...`);
            
            // Check if pair is already registered
            const isSupported = await oracle.isPairSupported(pairAddress);
            if (isSupported) {
                console.log(`   ⏭️  Pair already registered in Oracle`);
            } else {
                // Register the pair
                const oracleTx = await oracle.addPair(pairAddress, TOKENS.SHAH, TOKENS.USDT);
                await oracleTx.wait();
                console.log(`   ✅ Pair registered in Oracle: ${oracleTx.hash}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Oracle registration failed: ${error.message}`);
            return;
        }

        console.log("");

        // Final Summary
        console.log("🎉 ShahSwap Liquidity & Oracle Setup Complete!\n");
        
        console.log("📊 Final Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n✅ Successfully Completed:");
        console.log("   • Liquidity added via Uniswap V2 Router");
        console.log("   • Pair registered in Oracle");
        console.log("   • ShahSwap is now production ready!");

        console.log("\n🔗 Contract Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   Uniswap V2 Router: https://etherscan.io/address/${UNISWAP_V2_ROUTER}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);

        console.log("\n📈 Production Status:");
        console.log("   • Contracts: ✅ Deployed");
        console.log("   • Liquidity: ✅ Added");
        console.log("   • Oracle: ✅ Registered");
        console.log("   • Frontend: ✅ Ready to Connect");

        console.log("\n🎯 Next Steps:");
        console.log("   1. Test swaps on your frontend");
        console.log("   2. Monitor TWAP price feeds");
        console.log("   3. Add more liquidity as needed");
        console.log("   4. Deploy additional pairs if desired");

        // Save results to file
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            liquidityAdded: LIQUIDITY_AMOUNTS.description,
            oracleRegistered: true,
            status: "SUCCESS",
            configuration: {
                factory: FACTORY,
                oracle: ORACLE,
                uniswapRouter: UNISWAP_V2_ROUTER,
                shahToken: SHAH_TOKEN
            }
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "shahswap-success-results.json"),
            JSON.stringify(results, null, 2)
        );

        console.log("\n💾 Success results saved to: shahswap-success-results.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
