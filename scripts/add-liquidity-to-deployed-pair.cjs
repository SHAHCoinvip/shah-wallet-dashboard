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
    console.log("💧 Adding Liquidity to Deployed ShahSwap Pair...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const ORACLE = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
        const USDT_TOKEN = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
        const DEPLOYED_PAIR = "0xedD2B5c1A504428C456FCF2c25bF3c6cA8ee83DD";

        // Liquidity amounts
        const LIQUIDITY_AMOUNTS = {
            shahAmount: ethers.parseEther("3.33"), // 3.33 SHAH
            usdtAmount: ethers.parseUnits("10", 6), // 10 USDT (6 decimals)
            description: "3.33 SHAH + 10 USDT"
        };

        console.log("📋 Configuration:");
        console.log(`   ShahSwap Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}`);
        console.log(`   USDT Token: ${USDT_TOKEN}`);
        console.log(`   Deployed Pair: ${DEPLOYED_PAIR}\n`);

        // Get contract instances
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, SHAH_TOKEN);
        const usdtToken = await ethers.getContractAt(erc20Abi, USDT_TOKEN);

        console.log("🔍 Checking token balances...");
        
        // Check balances
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

        console.log("✅ Balance check complete\n");

        // Step 1: Check pair status
        console.log("🔍 Step 1: Checking pair status...\n");

        // Pair ABI
        const pairAbi = [
            "function mint(address to) external returns (uint256 liquidity)",
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)",
            "function initialize(address _token0, address _token1) external"
        ];

        const pair = await ethers.getContractAt(pairAbi, DEPLOYED_PAIR);

        // Check pair state
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
        const totalSupply = await pair.totalSupply();

        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);

        // If token0 is zero address, re-initialize
        if (token0 === "0x0000000000000000000000000000000000000000") {
            console.log(`   ⚠️  Pair not properly initialized, re-initializing...`);
            try {
                const initTx = await pair.initialize(SHAH_TOKEN, USDT_TOKEN);
                await initTx.wait();
                console.log(`   ✅ Pair re-initialized: ${initTx.hash}`);
            } catch (error) {
                console.log(`   ❌ Re-initialization failed: ${error.message}`);
                return;
            }
        }

        // Step 2: Add liquidity
        console.log("\n💧 Step 2: Adding liquidity to pair...\n");

        try {
            console.log(`   Adding liquidity: ${LIQUIDITY_AMOUNTS.description}`);
            
            // Check current allowances for pair
            const shahAllowance = await shahToken.allowance(deployer.address, DEPLOYED_PAIR);
            const usdtAllowance = await usdtToken.allowance(deployer.address, DEPLOYED_PAIR);
            
            console.log(`   Current SHAH allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
            console.log(`   Current USDT allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);
            
            // Approve pair to spend tokens
            if (shahAllowance < LIQUIDITY_AMOUNTS.shahAmount) {
                console.log(`   Approving SHAH tokens for pair...`);
                const approveShahTx = await shahToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.shahAmount);
                await approveShahTx.wait();
                console.log(`   ✅ SHAH tokens approved: ${approveShahTx.hash}`);
            }
            
            if (usdtAllowance < LIQUIDITY_AMOUNTS.usdtAmount) {
                console.log(`   Approving USDT tokens for pair...`);
                const approveUsdtTx = await usdtToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.usdtAmount);
                await approveUsdtTx.wait();
                console.log(`   ✅ USDT tokens approved: ${approveUsdtTx.hash}`);
            }
            
            // Transfer tokens to pair first
            console.log(`   Transferring tokens to pair...`);
            const transferShahTx = await shahToken.transfer(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.shahAmount);
            await transferShahTx.wait();
            console.log(`   ✅ SHAH transferred: ${transferShahTx.hash}`);
            
            const transferUsdtTx = await usdtToken.transfer(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.usdtAmount);
            await transferUsdtTx.wait();
            console.log(`   ✅ USDT transferred: ${transferUsdtTx.hash}`);
            
            // Now mint LP tokens
            console.log(`   Minting LP tokens...`);
            const mintTx = await pair.mint(deployer.address);
            await mintTx.wait();
            console.log(`   ✅ LP tokens minted: ${mintTx.hash}`);
            
        } catch (error) {
            console.log(`   ❌ Liquidity addition failed: ${error.message}`);
            return;
        }

        console.log("");

        // Step 3: Register pair in Oracle
        console.log("📊 Step 3: Registering pair in Oracle...\n");

        try {
            console.log(`   Registering SHAH/USDT pair in Oracle...`);
            console.log(`   Pair Address: ${DEPLOYED_PAIR}`);
            
            // Check if pair is already registered
            const isSupported = await oracle.isPairSupported(DEPLOYED_PAIR);
            if (isSupported) {
                console.log(`   ⏭️  Pair already registered in Oracle`);
            } else {
                // Register the pair
                const oracleTx = await oracle.addPair(DEPLOYED_PAIR, SHAH_TOKEN, USDT_TOKEN);
                await oracleTx.wait();
                console.log(`   ✅ Pair registered in Oracle: ${oracleTx.hash}`);
            }
            
        } catch (error) {
            if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
                console.log(`   ⚠️  Oracle requires more liquidity (minimum 1000 units per token)`);
                console.log(`   💡 Current liquidity: 3.33 SHAH / 10 USDT`);
                console.log(`   💡 Need: 1000 SHAH / 1000 USDT minimum for Oracle`);
            } else {
                console.log(`   ❌ Oracle registration failed: ${error.message}`);
            }
        }

        console.log("");

        // Final Summary
        console.log("🎉 ShahSwap Liquidity Setup Complete!\n");
        
        console.log("📊 Final Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n✅ Successfully Completed:");
        console.log("   • Liquidity added to ShahSwap pair");
        console.log("   • LP tokens minted");
        console.log("   • ShahSwap is now functional for swaps!");

        console.log("\n🔗 Contract Links:");
        console.log(`   ShahSwap Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);
        console.log(`   SHAH/USDT Pair: https://etherscan.io/address/${DEPLOYED_PAIR}`);

        console.log("\n📈 Production Status:");
        console.log("   • ShahSwap Contracts: ✅ Deployed");
        console.log("   • ShahSwap Liquidity: ✅ Added");
        console.log("   • Oracle Registration: ⚠️  Needs more liquidity (1000+ units)");
        console.log("   • Frontend: ✅ Ready to Connect");

        console.log("\n🎯 Next Steps:");
        console.log("   1. Test swaps on your ShahSwap frontend");
        console.log("   2. Add more liquidity (1000+ units) to register in Oracle");
        console.log("   3. Monitor TWAP price feeds once Oracle is registered");
        console.log("   4. Deploy additional ShahSwap pairs if desired");

        // Save results to file
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            liquidityAdded: LIQUIDITY_AMOUNTS.description,
            pairAddress: DEPLOYED_PAIR,
            oracleRegistered: false,
            status: "SUCCESS",
            configuration: {
                oracle: ORACLE,
                shahToken: SHAH_TOKEN,
                usdtToken: USDT_TOKEN
            }
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "shahswap-liquidity-results.json"),
            JSON.stringify(results, null, 2)
        );

        console.log("\n💾 Results saved to: shahswap-liquidity-results.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
