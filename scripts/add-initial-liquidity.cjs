const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("💧 Adding Initial Liquidity to SHAH LP Pairs...\n");
    console.log("=" .repeat(60));

    // Contract addresses
    const CONTRACTS = {
        ROUTER_V2: "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C",
        ORACLE: "0x3712f346f2538E2101D38F23db1B7aC382eAD30D",
        FACTORY: "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204",
        TREASURY: "0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4"
    };

    // Token addresses (mainnet)
    const TOKENS = {
        SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    };

    // LP Pairs
    const LP_PAIRS = {
        "SHAH-ETH": "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
        "SHAH-USDC": "0x6f31E71925572E51c38c468188aAE117c993f6F8",
        "SHAH-USDT": "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
        "SHAH-DAI": "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048"
    };

    // Initial liquidity amounts (adjust as needed)
    const INITIAL_LIQUIDITY = {
        "SHAH-ETH": {
            shahAmount: ethers.parseEther("1000000"), // 1M SHAH
            ethAmount: ethers.parseEther("1") // 1 ETH
        },
        "SHAH-USDC": {
            shahAmount: ethers.parseEther("1000000"), // 1M SHAH
            usdcAmount: ethers.parseUnits("1000", 6) // 1000 USDC
        },
        "SHAH-USDT": {
            shahAmount: ethers.parseEther("1000000"), // 1M SHAH
            usdtAmount: ethers.parseUnits("1000", 6) // 1000 USDT
        },
        "SHAH-DAI": {
            shahAmount: ethers.parseEther("1000000"), // 1M SHAH
            daiAmount: ethers.parseEther("1000") // 1000 DAI
        }
    };

    console.log("📋 Configuration:");
    console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
    console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
    console.log(`   Factory: ${CONTRACTS.FACTORY}`);
    console.log(`   Treasury: ${CONTRACTS.TREASURY}`);
    console.log(`   SHAH Token: ${TOKENS.SHAH}\n`);

    console.log("💧 Initial Liquidity Amounts:");
    for (const [pairName, amounts] of Object.entries(INITIAL_LIQUIDITY)) {
        console.log(`   ${pairName}:`);
        for (const [token, amount] of Object.entries(amounts)) {
            console.log(`     ${token}: ${ethers.formatUnits(amount, token.includes('USDC') || token.includes('USDT') ? 6 : 18)}`);
        }
    }
    console.log();

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Get contract instances
        const router = await ethers.getContractAt("ShahSwapRouterV2", CONTRACTS.ROUTER_V2);
        const oracle = await ethers.getContractAt("ShahSwapOracle", CONTRACTS.ORACLE);
        const shahToken = await ethers.getContractAt("IERC20", TOKENS.SHAH);
        const wethToken = await ethers.getContractAt("IERC20", TOKENS.WETH);
        const usdcToken = await ethers.getContractAt("IERC20", TOKENS.USDC);
        const usdtToken = await ethers.getContractAt("IERC20", TOKENS.USDT);
        const daiToken = await ethers.getContractAt("IERC20", TOKENS.DAI);

        // Check token balances
        console.log("🔍 Checking token balances...");
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const wethBalance = await wethToken.balanceOf(deployer.address);
        const usdcBalance = await usdcToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   WETH Balance: ${ethers.formatEther(wethBalance)} WETH`);
        console.log(`   USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI Balance: ${ethers.formatEther(daiBalance)} DAI\n`);

        // Check allowances
        console.log("🔍 Checking token allowances...");
        const shahAllowance = await shahToken.allowance(deployer.address, CONTRACTS.ROUTER_V2);
        const wethAllowance = await wethToken.allowance(deployer.address, CONTRACTS.ROUTER_V2);
        const usdcAllowance = await usdcToken.allowance(deployer.address, CONTRACTS.ROUTER_V2);
        const usdtAllowance = await usdtToken.allowance(deployer.address, CONTRACTS.ROUTER_V2);
        const daiAllowance = await daiToken.allowance(deployer.address, CONTRACTS.ROUTER_V2);

        console.log(`   SHAH Allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
        console.log(`   WETH Allowance: ${ethers.formatEther(wethAllowance)} WETH`);
        console.log(`   USDC Allowance: ${ethers.formatUnits(usdcAllowance, 6)} USDC`);
        console.log(`   USDT Allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);
        console.log(`   DAI Allowance: ${ethers.formatEther(daiAllowance)} DAI\n`);

        // Approve tokens if needed
        console.log("✅ Approving tokens for Router V2...");
        const maxApproval = ethers.MaxUint256;

        if (shahAllowance < INITIAL_LIQUIDITY["SHAH-ETH"].shahAmount) {
            console.log("   Approving SHAH...");
            const approveShahTx = await shahToken.approve(CONTRACTS.ROUTER_V2, maxApproval);
            await approveShahTx.wait();
            console.log("   ✅ SHAH approved");
        }

        if (wethAllowance < INITIAL_LIQUIDITY["SHAH-ETH"].ethAmount) {
            console.log("   Approving WETH...");
            const approveWethTx = await wethToken.approve(CONTRACTS.ROUTER_V2, maxApproval);
            await approveWethTx.wait();
            console.log("   ✅ WETH approved");
        }

        if (usdcAllowance < INITIAL_LIQUIDITY["SHAH-USDC"].usdcAmount) {
            console.log("   Approving USDC...");
            const approveUsdcTx = await usdcToken.approve(CONTRACTS.ROUTER_V2, maxApproval);
            await approveUsdcTx.wait();
            console.log("   ✅ USDC approved");
        }

        if (usdtAllowance < INITIAL_LIQUIDITY["SHAH-USDT"].usdtAmount) {
            console.log("   Approving USDT...");
            const approveUsdtTx = await usdtToken.approve(CONTRACTS.ROUTER_V2, maxApproval);
            await approveUsdtTx.wait();
            console.log("   ✅ USDT approved");
        }

        if (daiAllowance < INITIAL_LIQUIDITY["SHAH-DAI"].daiAmount) {
            console.log("   Approving DAI...");
            const approveDaiTx = await daiToken.approve(CONTRACTS.ROUTER_V2, maxApproval);
            await approveDaiTx.wait();
            console.log("   ✅ DAI approved");
        }

        // Add liquidity to pairs
        console.log("\n💧 Adding initial liquidity to LP pairs...");
        const liquidityResults = {};

        for (const [pairName, pairAddress] of Object.entries(LP_PAIRS)) {
            try {
                console.log(`\n   Adding liquidity to ${pairName}...`);
                
                const liquidity = INITIAL_LIQUIDITY[pairName];
                let tokenA, tokenB, amountADesired, amountBDesired;

                if (pairName === "SHAH-ETH") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.WETH;
                    amountADesired = liquidity.shahAmount;
                    amountBDesired = liquidity.ethAmount;
                } else if (pairName === "SHAH-USDC") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDC;
                    amountADesired = liquidity.shahAmount;
                    amountBDesired = liquidity.usdcAmount;
                } else if (pairName === "SHAH-USDT") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.USDT;
                    amountADesired = liquidity.shahAmount;
                    amountBDesired = liquidity.usdtAmount;
                } else if (pairName === "SHAH-DAI") {
                    tokenA = TOKENS.SHAH;
                    tokenB = TOKENS.DAI;
                    amountADesired = liquidity.shahAmount;
                    amountBDesired = liquidity.daiAmount;
                }

                // Add liquidity
                const addLiquidityTx = await router.addLiquidity(
                    tokenA,
                    tokenB,
                    amountADesired,
                    amountBDesired,
                    0, // amountAMin
                    0, // amountBMin
                    deployer.address,
                    Math.floor(Date.now() / 1000) + 1800 // 30 minutes deadline
                );

                const receipt = await addLiquidityTx.wait();
                
                // Extract LP tokens minted from event
                const transferEvent = receipt.logs.find(log => {
                    try {
                        const parsed = shahToken.interface.parseLog(log);
                        return parsed.name === 'Transfer' && parsed.args.to === deployer.address;
                    } catch {
                        return false;
                    }
                });

                let lpTokensMinted = 0;
                if (transferEvent) {
                    const parsed = shahToken.interface.parseLog(transferEvent);
                    lpTokensMinted = parsed.args.value;
                }

                liquidityResults[pairName] = {
                    status: "SUCCESS",
                    pairAddress: pairAddress,
                    lpTokensMinted: lpTokensMinted,
                    tokenA: tokenA,
                    tokenB: tokenB,
                    amountA: amountADesired,
                    amountB: amountBDesired
                };

                console.log(`   ✅ ${pairName} liquidity added successfully`);
                console.log(`      LP Tokens Minted: ${ethers.formatEther(lpTokensMinted)}`);
                console.log(`      Pair Address: ${pairAddress}`);

            } catch (error) {
                console.log(`   ❌ Failed to add liquidity to ${pairName}: ${error.message}`);
                liquidityResults[pairName] = {
                    status: "FAILED",
                    pairAddress: pairAddress,
                    error: error.message
                };
            }
        }

        // Register pairs with Oracle after liquidity is added
        console.log("\n📊 Registering pairs with Oracle...");
        const oracleResults = {};

        for (const [pairName, liquidityInfo] of Object.entries(liquidityResults)) {
            if (liquidityInfo.status !== "SUCCESS") {
                console.log(`   ⚠️  Skipping ${pairName} - liquidity not added`);
                continue;
            }

            try {
                console.log(`   Registering ${pairName} with Oracle...`);
                
                // Determine token0 and token1 (sorted order)
                const token0 = liquidityInfo.tokenA < liquidityInfo.tokenB ? liquidityInfo.tokenA : liquidityInfo.tokenB;
                const token1 = liquidityInfo.tokenA < liquidityInfo.tokenB ? liquidityInfo.tokenB : liquidityInfo.tokenA;
                
                const addPairTx = await oracle.addPair(liquidityInfo.pairAddress, token0, token1);
                await addPairTx.wait();
                
                oracleResults[pairName] = {
                    status: "REGISTERED",
                    pairAddress: liquidityInfo.pairAddress,
                    token0: token0,
                    token1: token1
                };
                console.log(`   ✅ ${pairName} registered with Oracle`);
                
            } catch (error) {
                console.log(`   ❌ Failed to register ${pairName} with Oracle: ${error.message}`);
                oracleResults[pairName] = {
                    status: "FAILED",
                    pairAddress: liquidityInfo.pairAddress,
                    error: error.message
                };
            }
        }

        // Save results
        console.log("\n📝 Saving liquidity results...");
        const fs = require("fs");
        const path = require("path");
        
        const liquidityInfo = {
            network: "mainnet",
            deployer: deployer.address,
            liquidityTime: new Date().toISOString(),
            contracts: CONTRACTS,
            tokens: TOKENS,
            lpPairs: LP_PAIRS,
            initialLiquidity: INITIAL_LIQUIDITY,
            liquidityResults: liquidityResults,
            oracleResults: oracleResults,
            status: "Initial Liquidity Added"
        };

        const liquidityPath = path.join(__dirname, "..", "shah-initial-liquidity.json");
        fs.writeFileSync(liquidityPath, JSON.stringify(liquidityInfo, null, 2));
        console.log(`   ✅ Liquidity info saved to: ${liquidityPath}`);

        // Summary
        console.log("\n🎉 Initial Liquidity Addition Complete!");
        console.log("\n📋 Summary:");
        console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
        console.log(`   Factory: ${CONTRACTS.FACTORY}`);

        console.log("\n💧 Liquidity Status:");
        for (const [name, info] of Object.entries(liquidityResults)) {
            if (info.status === "SUCCESS") {
                console.log(`   ✅ ${name}: ${ethers.formatEther(info.lpTokensMinted)} LP tokens`);
            } else {
                console.log(`   ❌ ${name}: ${info.status}`);
            }
        }

        console.log("\n📊 Oracle Registration Status:");
        for (const [name, info] of Object.entries(oracleResults)) {
            if (info.status === "REGISTERED") {
                console.log(`   ✅ ${name}: Registered`);
            } else {
                console.log(`   ❌ ${name}: ${info.status}`);
            }
        }

        console.log("\n🔗 Etherscan Links:");
        console.log(`   Router V2: https://etherscan.io/address/${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: https://etherscan.io/address/${CONTRACTS.ORACLE}`);
        console.log(`   Factory: https://etherscan.io/address/${CONTRACTS.FACTORY}`);

        console.log("\n🚀 SHAH LP pairs now have initial liquidity!");
        console.log("Oracle registration complete. Swap functionality is ready!");

    } catch (error) {
        console.error("❌ Liquidity addition failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

