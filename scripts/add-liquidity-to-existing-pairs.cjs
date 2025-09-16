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
    console.log("💧 Adding Liquidity to Existing ShahSwap Pairs...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Contract addresses
        const ROUTER_ADDRESS = "0x49CC894c82d19FdcBDedfbF98832553749e2F73E";
        const ORACLE = "0x3712f346f2538E2101D38F23db1B7aC382eAD30D";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Existing pair addresses
        const EXISTING_PAIRS = {
            "SHAH-ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
            "SHAH-USDC": "0x6f31E71925572E51c38c468188aAE117c993f6F8",
            "SHAH-USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
            "SHAH-DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048"
        };

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        console.log("📋 Configuration:");
        console.log(`   Router: ${ROUTER_ADDRESS}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const router = await ethers.getContractAt("ShahSwapRouterVS2", ROUTER_ADDRESS);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
        const daiToken = await ethers.getContractAt(erc20Abi, TOKENS.DAI);
        const usdcToken = await ethers.getContractAt(erc20Abi, TOKENS.USDC);

        console.log("🔍 Checking token balances...");
        
        // Check balances
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);
        const usdcBalance = await usdcToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI Balance: ${ethers.formatEther(daiBalance)} DAI`);
        console.log(`   USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
        console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

        // Calculate liquidity amounts based on available balances
        const LIQUIDITY_AMOUNTS = {
            "SHAH-USDT": {
                shahAmount: ethers.parseEther("3.33"), // Use available SHAH
                usdtAmount: ethers.parseUnits("10", 6), // Use all available USDT
                description: "3.33 SHAH + 10 USDT"
            },
            "SHAH-DAI": {
                shahAmount: ethers.parseEther("1"), // Use available SHAH
                daiAmount: ethers.parseEther("3"), // Use available DAI
                description: "1 SHAH + 3 DAI"
            }
            // Skip SHAH-ETH and SHAH-USDC due to insufficient balances
        };

        console.log("✅ Balance check complete\n");

        // Calculate deadline (20 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + (60 * 20);

        // Results tracking
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            router: ROUTER_ADDRESS,
            pairs: {},
            status: "SUCCESS"
        };

        // Step 1: Add SHAH/USDT liquidity
        console.log("💧 Step 1: Adding SHAH/USDT liquidity...\n");
        
        try {
            const pairName = "SHAH-USDT";
            const amounts = LIQUIDITY_AMOUNTS[pairName];
            
            console.log(`   Adding liquidity: ${amounts.description}`);
            console.log(`   Pair Address: ${EXISTING_PAIRS[pairName]}`);
            
            // Approve tokens
            console.log(`   Approving SHAH tokens...`);
            const approveShahTx = await shahToken.approve(ROUTER_ADDRESS, amounts.shahAmount);
            await approveShahTx.wait();
            console.log(`   ✅ SHAH approved: ${approveShahTx.hash}`);
            
            console.log(`   Approving USDT tokens...`);
            const approveUsdtTx = await usdtToken.approve(ROUTER_ADDRESS, amounts.usdtAmount);
            await approveUsdtTx.wait();
            console.log(`   ✅ USDT approved: ${approveUsdtTx.hash}`);
            
            // Add liquidity
            console.log(`   Adding liquidity...`);
            const addLiquidityTx = await router.addLiquidity(
                TOKENS.SHAH,
                TOKENS.USDT,
                amounts.shahAmount,
                amounts.usdtAmount,
                amounts.shahAmount * 99n / 100n, // 1% slippage
                amounts.usdtAmount * 99n / 100n, // 1% slippage
                deployer.address,
                deadline
            );
            await addLiquidityTx.wait();
            console.log(`   ✅ SHAH/USDT liquidity added: ${addLiquidityTx.hash}`);
            
            results.pairs[pairName] = {
                transactionHash: addLiquidityTx.hash,
                pairAddress: EXISTING_PAIRS[pairName],
                shahAmount: amounts.shahAmount.toString(),
                usdtAmount: amounts.usdtAmount.toString(),
                status: "SUCCESS"
            };
            
        } catch (error) {
            console.log(`   ❌ SHAH/USDT liquidity failed: ${error.message}`);
            results.pairs["SHAH-USDT"] = { status: "FAILED", error: error.message };
        }

        console.log("");

        // Step 2: Add SHAH/DAI liquidity
        console.log("💧 Step 2: Adding SHAH/DAI liquidity...\n");
        
        try {
            const pairName = "SHAH-DAI";
            const amounts = LIQUIDITY_AMOUNTS[pairName];
            
            console.log(`   Adding liquidity: ${amounts.description}`);
            console.log(`   Pair Address: ${EXISTING_PAIRS[pairName]}`);
            
            // Approve tokens
            console.log(`   Approving SHAH tokens...`);
            const approveShahTx = await shahToken.approve(ROUTER_ADDRESS, amounts.shahAmount);
            await approveShahTx.wait();
            console.log(`   ✅ SHAH approved: ${approveShahTx.hash}`);
            
            console.log(`   Approving DAI tokens...`);
            const approveDaiTx = await daiToken.approve(ROUTER_ADDRESS, amounts.daiAmount);
            await approveDaiTx.wait();
            console.log(`   ✅ DAI approved: ${approveDaiTx.hash}`);
            
            // Add liquidity
            console.log(`   Adding liquidity...`);
            const addLiquidityTx = await router.addLiquidity(
                TOKENS.SHAH,
                TOKENS.DAI,
                amounts.shahAmount,
                amounts.daiAmount,
                amounts.shahAmount * 99n / 100n, // 1% slippage
                amounts.daiAmount * 99n / 100n, // 1% slippage
                deployer.address,
                deadline
            );
            await addLiquidityTx.wait();
            console.log(`   ✅ SHAH/DAI liquidity added: ${addLiquidityTx.hash}`);
            
            results.pairs[pairName] = {
                transactionHash: addLiquidityTx.hash,
                pairAddress: EXISTING_PAIRS[pairName],
                shahAmount: amounts.shahAmount.toString(),
                daiAmount: amounts.daiAmount.toString(),
                status: "SUCCESS"
            };
            
        } catch (error) {
            console.log(`   ❌ SHAH/DAI liquidity failed: ${error.message}`);
            results.pairs["SHAH-DAI"] = { status: "FAILED", error: error.message };
        }

        console.log("");

        // Step 3: Register pairs in Oracle
        console.log("📊 Step 3: Registering pairs in Oracle...\n");

        for (const [pairName, pairInfo] of Object.entries(results.pairs)) {
            if (pairInfo.status === "SUCCESS") {
                try {
                    let tokenA, tokenB;
                    
                    if (pairName === "SHAH-USDT") {
                        tokenA = TOKENS.SHAH;
                        tokenB = TOKENS.USDT;
                    } else if (pairName === "SHAH-DAI") {
                        tokenA = TOKENS.SHAH;
                        tokenB = TOKENS.DAI;
                    }
                    
                    console.log(`   Registering ${pairName} pair in Oracle...`);
                    console.log(`   Pair Address: ${pairInfo.pairAddress}`);
                    
                    // Check if pair is already registered
                    const isSupported = await oracle.isPairSupported(pairInfo.pairAddress);
                    if (isSupported) {
                        console.log(`   ⏭️  ${pairName} already registered in Oracle`);
                    } else {
                        // Register the pair
                        const oracleTx = await oracle.addPair(pairInfo.pairAddress, tokenA, tokenB);
                        await oracleTx.wait();
                        console.log(`   ✅ ${pairName} registered in Oracle: ${oracleTx.hash}`);
                    }
                    
                } catch (error) {
                    if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
                        console.log(`   ⚠️  ${pairName} Oracle registration requires more liquidity (minimum 1000 units per token)`);
                    } else {
                        console.log(`   ❌ ${pairName} Oracle registration failed: ${error.message}`);
                    }
                }
            }
        }

        console.log("");

        // Final Summary
        console.log("🎉 Liquidity Addition to Existing Pairs Complete!\n");
        
        console.log("📊 Final Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        const successfulPairs = Object.entries(results.pairs).filter(([_, info]) => info.status === "SUCCESS");
        const failedPairs = Object.entries(results.pairs).filter(([_, info]) => info.status === "FAILED");
        
        console.log(`\n✅ Successfully Added Liquidity (${successfulPairs.length} pairs):`);
        successfulPairs.forEach(([pairName, info]) => {
            console.log(`   • ${pairName}: ${info.transactionHash}`);
            console.log(`     Pair Address: ${info.pairAddress}`);
        });
        
        if (failedPairs.length > 0) {
            console.log(`\n❌ Failed to Add Liquidity (${failedPairs.length} pairs):`);
            failedPairs.forEach(([pairName, info]) => {
                console.log(`   • ${pairName}: ${info.error}`);
            });
        }

        console.log("\n📋 All Existing Pairs:");
        Object.entries(EXISTING_PAIRS).forEach(([pairName, address]) => {
            console.log(`   • ${pairName}: ${address}`);
        });

        console.log("\n🔗 Contract Links:");
        console.log(`   ShahSwapRouterVS2: https://etherscan.io/address/${ROUTER_ADDRESS}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);

        console.log("\n🎯 Next Steps:");
        console.log("   1. Test swaps on your frontend using existing pairs");
        console.log("   2. Monitor liquidity pools");
        console.log("   3. Add more liquidity as needed");
        console.log("   4. Test remove liquidity: npx hardhat run scripts/remove-test-liquidity.cjs --network mainnet");

        // Save results to file
        const resultsPath = path.join(__dirname, "..", "existing-pairs-liquidity-results.json");
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: existing-pairs-liquidity-results.json`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
