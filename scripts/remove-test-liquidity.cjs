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
    console.log("💧 Removing Test Liquidity from ShahSwap Pairs...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Load deployment info
        const deploymentPath = path.join(__dirname, "..", "deployments", "shahswaproutervs2.json");
        
        if (!fs.existsSync(deploymentPath)) {
            throw new Error("Deployment file not found. Please run deploy-shahswaproutervs2.cjs first.");
        }

        const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
        const ROUTER_ADDRESS = deployment.contractAddress;

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        console.log("📋 Configuration:");
        console.log(`   ShahSwapRouterVS2: ${ROUTER_ADDRESS}`);
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const router = await ethers.getContractAt("ShahSwapRouterVS2", ROUTER_ADDRESS);
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        // Pair ABI
        const pairAbi = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];

        console.log("🔍 Checking LP token balances...\n");

        // Results tracking
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            router: ROUTER_ADDRESS,
            pairs: {},
            status: "SUCCESS"
        };

        // Calculate deadline (20 minutes from now)
        const deadline = Math.floor(Date.now() / 1000) + (60 * 20);

        // Step 1: Remove SHAH/USDT liquidity
        console.log("💧 Step 1: Removing SHAH/USDT liquidity...\n");
        
        try {
            const pairName = "SHAH/USDT";
            const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
            
            if (pairAddress === "0x0000000000000000000000000000000000000000") {
                console.log(`   ⏭️  ${pairName} pair does not exist`);
                results.pairs[pairName] = { status: "SKIPPED", reason: "Pair does not exist" };
            } else {
                console.log(`   Pair Address: ${pairAddress}`);
                
                // Get LP token contract
                const lpToken = await ethers.getContractAt(erc20Abi, pairAddress);
                const lpBalance = await lpToken.balanceOf(deployer.address);
                
                console.log(`   LP Token Balance: ${ethers.formatEther(lpBalance)} LP tokens`);
                
                if (lpBalance === 0n) {
                    console.log(`   ⏭️  No LP tokens to remove`);
                    results.pairs[pairName] = { status: "SKIPPED", reason: "No LP tokens" };
                } else {
                    // Get pair info
                    const pair = await ethers.getContractAt(pairAbi, pairAddress);
                    const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                    const totalSupply = await pair.totalSupply();
                    
                    // Calculate expected token amounts
                    const shahAmount = (reserve0 * lpBalance) / totalSupply;
                    const usdtAmount = (reserve1 * lpBalance) / totalSupply;
                    
                    console.log(`   Expected SHAH: ${ethers.formatEther(shahAmount)}`);
                    console.log(`   Expected USDT: ${ethers.formatUnits(usdtAmount, 6)}`);
                    
                    // Approve LP tokens for router
                    console.log(`   Approving LP tokens for router...`);
                    const approveTx = await lpToken.approve(ROUTER_ADDRESS, lpBalance);
                    await approveTx.wait();
                    console.log(`   ✅ LP tokens approved: ${approveTx.hash}`);
                    
                    // Remove liquidity
                    console.log(`   Removing liquidity...`);
                    const removeTx = await router.removeLiquidity(
                        TOKENS.SHAH,
                        TOKENS.USDT,
                        lpBalance,
                        shahAmount * 99n / 100n, // 1% slippage
                        usdtAmount * 99n / 100n, // 1% slippage
                        deployer.address,
                        deadline
                    );
                    await removeTx.wait();
                    console.log(`   ✅ ${pairName} liquidity removed: ${removeTx.hash}`);
                    
                    results.pairs[pairName] = {
                        transactionHash: removeTx.hash,
                        lpAmount: lpBalance.toString(),
                        shahAmount: shahAmount.toString(),
                        usdtAmount: usdtAmount.toString(),
                        status: "SUCCESS"
                    };
                }
            }
            
        } catch (error) {
            console.log(`   ❌ SHAH/USDT liquidity removal failed: ${error.message}`);
            results.pairs["SHAH/USDT"] = { status: "FAILED", error: error.message };
        }

        console.log("");

        // Step 2: Remove SHAH/ETH liquidity
        console.log("💧 Step 2: Removing SHAH/ETH liquidity...\n");
        
        try {
            const pairName = "SHAH/ETH";
            const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.WETH);
            
            if (pairAddress === "0x0000000000000000000000000000000000000000") {
                console.log(`   ⏭️  ${pairName} pair does not exist`);
                results.pairs[pairName] = { status: "SKIPPED", reason: "Pair does not exist" };
            } else {
                console.log(`   Pair Address: ${pairAddress}`);
                
                // Get LP token contract
                const lpToken = await ethers.getContractAt(erc20Abi, pairAddress);
                const lpBalance = await lpToken.balanceOf(deployer.address);
                
                console.log(`   LP Token Balance: ${ethers.formatEther(lpBalance)} LP tokens`);
                
                if (lpBalance === 0n) {
                    console.log(`   ⏭️  No LP tokens to remove`);
                    results.pairs[pairName] = { status: "SKIPPED", reason: "No LP tokens" };
                } else {
                    // Get pair info
                    const pair = await ethers.getContractAt(pairAbi, pairAddress);
                    const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                    const totalSupply = await pair.totalSupply();
                    
                    // Calculate expected token amounts
                    const shahAmount = (reserve0 * lpBalance) / totalSupply;
                    const ethAmount = (reserve1 * lpBalance) / totalSupply;
                    
                    console.log(`   Expected SHAH: ${ethers.formatEther(shahAmount)}`);
                    console.log(`   Expected ETH: ${ethers.formatEther(ethAmount)}`);
                    
                    // Approve LP tokens for router
                    console.log(`   Approving LP tokens for router...`);
                    const approveTx = await lpToken.approve(ROUTER_ADDRESS, lpBalance);
                    await approveTx.wait();
                    console.log(`   ✅ LP tokens approved: ${approveTx.hash}`);
                    
                    // Remove liquidity
                    console.log(`   Removing liquidity...`);
                    const removeTx = await router.removeLiquidityETH(
                        TOKENS.SHAH,
                        lpBalance,
                        shahAmount * 99n / 100n, // 1% slippage
                        ethAmount * 99n / 100n, // 1% slippage
                        deployer.address,
                        deadline
                    );
                    await removeTx.wait();
                    console.log(`   ✅ ${pairName} liquidity removed: ${removeTx.hash}`);
                    
                    results.pairs[pairName] = {
                        transactionHash: removeTx.hash,
                        lpAmount: lpBalance.toString(),
                        shahAmount: shahAmount.toString(),
                        ethAmount: ethAmount.toString(),
                        status: "SUCCESS"
                    };
                }
            }
            
        } catch (error) {
            console.log(`   ❌ SHAH/ETH liquidity removal failed: ${error.message}`);
            results.pairs["SHAH/ETH"] = { status: "FAILED", error: error.message };
        }

        console.log("");

        // Step 3: Remove SHAH/DAI liquidity
        console.log("💧 Step 3: Removing SHAH/DAI liquidity...\n");
        
        try {
            const pairName = "SHAH/DAI";
            const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.DAI);
            
            if (pairAddress === "0x0000000000000000000000000000000000000000") {
                console.log(`   ⏭️  ${pairName} pair does not exist`);
                results.pairs[pairName] = { status: "SKIPPED", reason: "Pair does not exist" };
            } else {
                console.log(`   Pair Address: ${pairAddress}`);
                
                // Get LP token contract
                const lpToken = await ethers.getContractAt(erc20Abi, pairAddress);
                const lpBalance = await lpToken.balanceOf(deployer.address);
                
                console.log(`   LP Token Balance: ${ethers.formatEther(lpBalance)} LP tokens`);
                
                if (lpBalance === 0n) {
                    console.log(`   ⏭️  No LP tokens to remove`);
                    results.pairs[pairName] = { status: "SKIPPED", reason: "No LP tokens" };
                } else {
                    // Get pair info
                    const pair = await ethers.getContractAt(pairAbi, pairAddress);
                    const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                    const totalSupply = await pair.totalSupply();
                    
                    // Calculate expected token amounts
                    const shahAmount = (reserve0 * lpBalance) / totalSupply;
                    const daiAmount = (reserve1 * lpBalance) / totalSupply;
                    
                    console.log(`   Expected SHAH: ${ethers.formatEther(shahAmount)}`);
                    console.log(`   Expected DAI: ${ethers.formatEther(daiAmount)}`);
                    
                    // Approve LP tokens for router
                    console.log(`   Approving LP tokens for router...`);
                    const approveTx = await lpToken.approve(ROUTER_ADDRESS, lpBalance);
                    await approveTx.wait();
                    console.log(`   ✅ LP tokens approved: ${approveTx.hash}`);
                    
                    // Remove liquidity
                    console.log(`   Removing liquidity...`);
                    const removeTx = await router.removeLiquidity(
                        TOKENS.SHAH,
                        TOKENS.DAI,
                        lpBalance,
                        shahAmount * 99n / 100n, // 1% slippage
                        daiAmount * 99n / 100n, // 1% slippage
                        deployer.address,
                        deadline
                    );
                    await removeTx.wait();
                    console.log(`   ✅ ${pairName} liquidity removed: ${removeTx.hash}`);
                    
                    results.pairs[pairName] = {
                        transactionHash: removeTx.hash,
                        lpAmount: lpBalance.toString(),
                        shahAmount: shahAmount.toString(),
                        daiAmount: daiAmount.toString(),
                        status: "SUCCESS"
                    };
                }
            }
            
        } catch (error) {
            console.log(`   ❌ SHAH/DAI liquidity removal failed: ${error.message}`);
            results.pairs["SHAH/DAI"] = { status: "FAILED", error: error.message };
        }

        console.log("");

        // Final Summary
        console.log("🎉 Test Liquidity Removal Complete!\n");
        
        console.log("📊 Final Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        const successfulPairs = Object.entries(results.pairs).filter(([_, info]) => info.status === "SUCCESS");
        const failedPairs = Object.entries(results.pairs).filter(([_, info]) => info.status === "FAILED");
        const skippedPairs = Object.entries(results.pairs).filter(([_, info]) => info.status === "SKIPPED");
        
        console.log(`\n✅ Successfully Removed Liquidity (${successfulPairs.length} pairs):`);
        successfulPairs.forEach(([pairName, info]) => {
            console.log(`   • ${pairName}: ${info.transactionHash}`);
        });
        
        if (skippedPairs.length > 0) {
            console.log(`\n⏭️  Skipped (${skippedPairs.length} pairs):`);
            skippedPairs.forEach(([pairName, info]) => {
                console.log(`   • ${pairName}: ${info.reason}`);
            });
        }
        
        if (failedPairs.length > 0) {
            console.log(`\n❌ Failed to Remove Liquidity (${failedPairs.length} pairs):`);
            failedPairs.forEach(([pairName, info]) => {
                console.log(`   • ${pairName}: ${info.error}`);
            });
        }

        console.log("\n🔗 Contract Links:");
        console.log(`   ShahSwapRouterVS2: https://etherscan.io/address/${ROUTER_ADDRESS}`);
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);

        console.log("\n🎯 Next Steps:");
        console.log("   1. Check token balances in wallet");
        console.log("   2. Verify all liquidity has been removed");
        console.log("   3. Test adding liquidity again if needed");
        console.log("   4. Monitor gas costs and optimize if necessary");

        // Save results to file
        const resultsPath = path.join(__dirname, "..", "remove-liquidity-results.json");
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: remove-liquidity-results.json`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
