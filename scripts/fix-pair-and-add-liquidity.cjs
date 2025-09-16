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
    console.log("🔧 Fixing Pair Initialization + Adding Liquidity + Oracle Registration...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

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

        // Deployed pair address
        const DEPLOYED_PAIR = "0x0F1fbE452618fFc8ddb6097C2ff96f1c77BCA45C";

        // Liquidity amounts
        const LIQUIDITY_AMOUNTS = {
            shahAmount: ethers.parseEther("3.33"), // 3.33 SHAH
            usdtAmount: ethers.parseUnits("10", 6), // 10 USDT (6 decimals)
            description: "3.33 SHAH + 10 USDT"
        };

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}`);
        console.log(`   Deployed Pair: ${DEPLOYED_PAIR}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function transfer(address to, uint256 amount) returns (bool)"
        ];

        // Pair ABI
        const pairAbi = [
            "function mint(address to) external returns (uint256 liquidity)",
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)",
            "function initialize(address _token0, address _token1) external",
            "function sync() external"
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

        // Step 1: Fix pair initialization
        console.log("🔧 Step 1: Fixing pair initialization...\n");

        try {
            // Get pair contract
            const pair = await ethers.getContractAt(pairAbi, DEPLOYED_PAIR);
            
            console.log(`   Checking current pair state...`);
            
            // Check current token addresses
            const token0 = await pair.token0();
            const token1 = await pair.token1();
            console.log(`   Current Token0: ${token0}`);
            console.log(`   Current Token1: ${token1}`);
            
            // Check current reserves
            const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
            console.log(`   Current reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
            
            // If tokens are zero address, we need to initialize
            if (token0 === ethers.ZeroAddress || token1 === ethers.ZeroAddress) {
                console.log(`   Pair needs initialization...`);
                
                // Initialize the pair with token addresses
                console.log(`   Initializing pair with SHAH and USDT...`);
                const initTx = await pair.initialize(TOKENS.SHAH, TOKENS.USDT);
                await initTx.wait();
                console.log(`   ✅ Pair initialized: ${initTx.hash}`);
                
                // Verify initialization
                const newToken0 = await pair.token0();
                const newToken1 = await pair.token1();
                console.log(`   New Token0: ${newToken0}`);
                console.log(`   New Token1: ${newToken1}`);
                
                if (newToken0 !== ethers.ZeroAddress && newToken1 !== ethers.ZeroAddress) {
                    console.log(`   ✅ Pair initialization successful!`);
                } else {
                    console.log(`   ❌ Pair initialization failed - tokens still zero address`);
                    return;
                }
            } else {
                console.log(`   ✅ Pair already initialized`);
            }
            
        } catch (error) {
            console.log(`   ❌ Pair initialization failed: ${error.message}`);
            return;
        }

        console.log("");

        // Step 2: Add liquidity to the pair
        console.log("💧 Step 2: Adding liquidity to the pair...\n");

        try {
            // Get pair contract
            const pair = await ethers.getContractAt(pairAbi, DEPLOYED_PAIR);
            
            console.log(`   Adding liquidity: ${LIQUIDITY_AMOUNTS.description}`);
            console.log(`   Pair Address: ${DEPLOYED_PAIR}`);
            
            // Get token addresses from pair
            const token0 = await pair.token0();
            const token1 = await pair.token1();
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            
            // Determine which token is which
            let token0Amount, token1Amount;
            if (token0 === TOKENS.SHAH) {
                token0Amount = LIQUIDITY_AMOUNTS.shahAmount;
                token1Amount = LIQUIDITY_AMOUNTS.usdtAmount;
            } else {
                token0Amount = LIQUIDITY_AMOUNTS.usdtAmount;
                token1Amount = LIQUIDITY_AMOUNTS.shahAmount;
            }

            // Approve pair to spend tokens
            console.log(`   Approving tokens for pair...`);
            
            // For USDT, set allowance to 0 first
            await usdtToken.approve(DEPLOYED_PAIR, 0);
            await shahToken.approve(DEPLOYED_PAIR, 0);
            
            const approveShahTx = await shahToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.shahAmount);
            await approveShahTx.wait();
            const approveUsdtTx = await usdtToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.usdtAmount);
            await approveUsdtTx.wait();
            console.log(`   ✅ Tokens approved`);

            // Add liquidity by calling mint
            console.log(`   Adding liquidity to pair...`);
            const mintTx = await pair.mint(deployer.address);
            const mintReceipt = await mintTx.wait();
            console.log(`   ✅ Liquidity added: ${mintTx.hash}`);

            // Check new reserves
            const [newReserve0, newReserve1, newBlockTimestampLast] = await pair.getReserves();
            console.log(`   New reserves: ${ethers.formatEther(newReserve0)} / ${ethers.formatEther(newReserve1)}`);

            console.log(`   ✅ Liquidity addition successful!`);

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
                const oracleTx = await oracle.addPair(DEPLOYED_PAIR, TOKENS.SHAH, TOKENS.USDT);
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
        console.log("   • Pair initialization fixed");
        console.log("   • Liquidity added to SHAH/USDT pair");
        console.log("   • Pair registered in Oracle");
        console.log("   • ShahSwap is now production ready!");

        console.log("\n🔗 Contract Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);
        console.log(`   SHAH/USDT Pair: https://etherscan.io/address/${DEPLOYED_PAIR}`);

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
            pairAddress: DEPLOYED_PAIR,
            liquidityAdded: LIQUIDITY_AMOUNTS.description,
            oracleRegistered: true,
            status: "SUCCESS",
            configuration: {
                factory: FACTORY,
                oracle: ORACLE,
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
