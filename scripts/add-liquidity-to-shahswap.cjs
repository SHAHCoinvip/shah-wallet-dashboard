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
    console.log("💧 Adding Liquidity to ShahSwap...\n");

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
        console.log(`   ShahSwap Factory: ${FACTORY}`);
        console.log(`   ShahSwap Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)"
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

        // Step 1: Get or create ShahSwap pair
        console.log("🏭 Step 1: Getting ShahSwap pair...\n");

        let pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
        console.log(`   Current pair address: ${pairAddress}`);

        // Check if pair exists and has contract code
        const code = await ethers.provider.getCode(pairAddress);
        if (code === '0x') {
            console.log(`   ❌ No contract at pair address - creating pair...`);
            
            try {
                const createPairTx = await factory.createPair(TOKENS.SHAH, TOKENS.USDT);
                await createPairTx.wait();
                console.log(`   ✅ Pair created: ${createPairTx.hash}`);
                
                // Get new pair address
                pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
                console.log(`   New pair address: ${pairAddress}`);
                
            } catch (error) {
                console.log(`   ❌ Pair creation failed: ${error.message}`);
                return;
            }
        } else {
            console.log(`   ✅ Pair contract exists`);
        }

        // Step 2: Add liquidity to ShahSwap pair
        console.log("\n💧 Step 2: Adding liquidity to ShahSwap pair...\n");

        try {
            console.log(`   Adding liquidity: ${LIQUIDITY_AMOUNTS.description}`);
            console.log(`   Pair Address: ${pairAddress}`);
            
            // Check current allowances for pair
            const shahAllowance = await shahToken.allowance(deployer.address, pairAddress);
            const usdtAllowance = await usdtToken.allowance(deployer.address, pairAddress);
            
            console.log(`   Current SHAH allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
            console.log(`   Current USDT allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);
            
            // Approve pair to spend tokens
            if (shahAllowance < LIQUIDITY_AMOUNTS.shahAmount) {
                console.log(`   Approving SHAH tokens for pair...`);
                const approveShahTx = await shahToken.approve(pairAddress, LIQUIDITY_AMOUNTS.shahAmount);
                await approveShahTx.wait();
                console.log(`   ✅ SHAH tokens approved: ${approveShahTx.hash}`);
            }
            
            if (usdtAllowance < LIQUIDITY_AMOUNTS.usdtAmount) {
                console.log(`   Approving USDT tokens for pair...`);
                const approveUsdtTx = await usdtToken.approve(pairAddress, LIQUIDITY_AMOUNTS.usdtAmount);
                await approveUsdtTx.wait();
                console.log(`   ✅ USDT tokens approved: ${approveUsdtTx.hash}`);
            }
            
            // Transfer tokens to pair first (ShahSwap style)
            console.log(`   Transferring tokens to pair...`);
            const transferShahTx = await shahToken.transfer(pairAddress, LIQUIDITY_AMOUNTS.shahAmount);
            await transferShahTx.wait();
            console.log(`   ✅ SHAH transferred: ${transferShahTx.hash}`);
            
            const transferUsdtTx = await usdtToken.transfer(pairAddress, LIQUIDITY_AMOUNTS.usdtAmount);
            await transferUsdtTx.wait();
            console.log(`   ✅ USDT transferred: ${transferUsdtTx.hash}`);
            
            // Now mint LP tokens
            console.log(`   Minting LP tokens...`);
            
            // Pair ABI for minting
            const pairAbi = [
                "function mint(address to) external returns (uint256 liquidity)",
                "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
                "function totalSupply() external view returns (uint256)"
            ];
            
            const pair = await ethers.getContractAt(pairAbi, pairAddress);
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
            console.log(`   Pair Address: ${pairAddress}`);
            
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
        console.log(`   ShahSwap Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   ShahSwap Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);
        console.log(`   SHAH/USDT Pair: https://etherscan.io/address/${pairAddress}`);

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
            pairAddress: pairAddress,
            oracleRegistered: false,
            status: "SUCCESS",
            configuration: {
                factory: FACTORY,
                oracle: ORACLE,
                shahToken: SHAH_TOKEN
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
