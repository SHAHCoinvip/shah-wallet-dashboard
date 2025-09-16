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
    console.log("💧 Adding Liquidity the Correct Way...\n");

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
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
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

        // Step 1: Try different approaches to add liquidity
        console.log("💧 Step 1: Trying different liquidity addition approaches...\n");

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
            
            // Check current reserves
            const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
            console.log(`   Current reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);

            // Check current allowances
            const shahAllowance = await shahToken.allowance(deployer.address, DEPLOYED_PAIR);
            const usdtAllowance = await usdtToken.allowance(deployer.address, DEPLOYED_PAIR);
            console.log(`   SHAH Allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
            console.log(`   USDT Allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);

            // Approach 1: Try mint with current allowances
            console.log(`\n   🔄 Approach 1: Direct mint with current allowances...`);
            try {
                const mintTx = await pair.mint(deployer.address);
                const mintReceipt = await mintTx.wait();
                console.log(`   ✅ Liquidity added successfully: ${mintTx.hash}`);
                
                // Check new reserves
                const [newReserve0, newReserve1, newBlockTimestampLast] = await pair.getReserves();
                console.log(`   New reserves: ${ethers.formatEther(newReserve0)} / ${ethers.formatEther(newReserve1)}`);
                
                console.log(`   ✅ Approach 1 worked!`);
                
            } catch (mintError) {
                console.log(`   ❌ Approach 1 failed: ${mintError.message}`);
                
                // Approach 2: Try with fresh approvals
                console.log(`\n   🔄 Approach 2: Fresh approvals and mint...`);
                try {
                    // Reset approvals to 0 first
                    console.log(`   Resetting approvals...`);
                    await shahToken.approve(DEPLOYED_PAIR, 0);
                    await usdtToken.approve(DEPLOYED_PAIR, 0);
                    
                    // Wait a moment
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Set new approvals
                    console.log(`   Setting new approvals...`);
                    const approveShahTx = await shahToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.shahAmount);
                    await approveShahTx.wait();
                    const approveUsdtTx = await usdtToken.approve(DEPLOYED_PAIR, LIQUIDITY_AMOUNTS.usdtAmount);
                    await approveUsdtTx.wait();
                    
                    console.log(`   ✅ Fresh approvals set`);
                    
                    // Wait a moment
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Try mint again
                    console.log(`   Trying mint with fresh approvals...`);
                    const mintTx2 = await pair.mint(deployer.address);
                    const mintReceipt2 = await mintTx2.wait();
                    console.log(`   ✅ Liquidity added successfully: ${mintTx2.hash}`);
                    
                    // Check new reserves
                    const [newReserve0, newReserve1, newBlockTimestampLast] = await pair.getReserves();
                    console.log(`   New reserves: ${ethers.formatEther(newReserve0)} / ${ethers.formatEther(newReserve1)}`);
                    
                    console.log(`   ✅ Approach 2 worked!`);
                    
                } catch (mintError2) {
                    console.log(`   ❌ Approach 2 failed: ${mintError2.message}`);
                    
                    // Approach 3: Try sync first
                    console.log(`\n   🔄 Approach 3: Sync then mint...`);
                    try {
                        console.log(`   Calling sync...`);
                        const syncTx = await pair.sync();
                        await syncTx.wait();
                        console.log(`   ✅ Sync completed`);
                        
                        // Try mint after sync
                        console.log(`   Trying mint after sync...`);
                        const mintTx3 = await pair.mint(deployer.address);
                        const mintReceipt3 = await mintTx3.wait();
                        console.log(`   ✅ Liquidity added successfully: ${mintTx3.hash}`);
                        
                        // Check new reserves
                        const [newReserve0, newReserve1, newBlockTimestampLast] = await pair.getReserves();
                        console.log(`   New reserves: ${ethers.formatEther(newReserve0)} / ${ethers.formatEther(newReserve1)}`);
                        
                        console.log(`   ✅ Approach 3 worked!`);
                        
                    } catch (mintError3) {
                        console.log(`   ❌ Approach 3 failed: ${mintError3.message}`);
                        console.log(`   ❌ All approaches failed - need to investigate further`);
                        return;
                    }
                }
            }

        } catch (error) {
            console.log(`   ❌ Liquidity addition failed: ${error.message}`);
            return;
        }

        console.log("");

        // Step 2: Register pair in Oracle
        console.log("📊 Step 2: Registering pair in Oracle...\n");

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
