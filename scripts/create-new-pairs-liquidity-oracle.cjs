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
    console.log("🆕 Creating New Pairs + Adding Liquidity + Oracle Registration...\n");

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

        // Liquidity amounts (small test amounts)
        const LIQUIDITY_AMOUNTS = {
            "USDT/SHAH": { // Different token order to get new address
                usdtAmount: ethers.parseUnits("10", 6), // 10 USDT (6 decimals)
                shahAmount: ethers.parseEther("3.33"), // 3.33 SHAH
                description: "10 USDT + 3.33 SHAH"
            },
            "DAI/SHAH": { // Different token order to get new address
                daiAmount: ethers.parseEther("3"), // 3 DAI
                shahAmount: ethers.parseEther("1"), // 1 SHAH
                description: "3 DAI + 1 SHAH"
            },
            "WETH/SHAH": { // Different token order to get new address
                wethAmount: ethers.parseEther("0.0005"), // 0.0005 WETH (~$1.5 at $3000/ETH)
                shahAmount: ethers.parseEther("0.5"), // 0.5 SHAH
                description: "0.0005 WETH + 0.5 SHAH"
            }
        };

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function deposit() payable",
            "function withdraw(uint256 amount)"
        ];

        // Pair ABI for adding liquidity
        const pairAbi = [
            "function mint(address to) external returns (uint256 liquidity)",
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
        const daiToken = await ethers.getContractAt(erc20Abi, TOKENS.DAI);
        const wethToken = await ethers.getContractAt(erc20Abi, TOKENS.WETH);

        console.log("🔍 Checking token balances...");
        
        // Check balances
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI Balance: ${ethers.formatEther(daiBalance)} DAI`);
        console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH\n`);

        // Check if we have enough tokens
        const totalShahNeeded = LIQUIDITY_AMOUNTS["USDT/SHAH"].shahAmount + 
                               LIQUIDITY_AMOUNTS["DAI/SHAH"].shahAmount + 
                               LIQUIDITY_AMOUNTS["WETH/SHAH"].shahAmount;
        
        if (shahBalance < totalShahNeeded) {
            console.log(`⚠️  Insufficient SHAH balance. Need ${ethers.formatEther(totalShahNeeded)} SHAH, have ${ethers.formatEther(shahBalance)} SHAH`);
        }

        if (usdtBalance < LIQUIDITY_AMOUNTS["USDT/SHAH"].usdtAmount) {
            console.log(`⚠️  Insufficient USDT balance. Need ${ethers.formatUnits(LIQUIDITY_AMOUNTS["USDT/SHAH"].usdtAmount, 6)} USDT, have ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        }

        if (daiBalance < LIQUIDITY_AMOUNTS["DAI/SHAH"].daiAmount) {
            console.log(`⚠️  Insufficient DAI balance. Need ${ethers.formatEther(LIQUIDITY_AMOUNTS["DAI/SHAH"].daiAmount)} DAI, have ${ethers.formatEther(daiBalance)} DAI`);
        }

        if (ethBalance < LIQUIDITY_AMOUNTS["WETH/SHAH"].wethAmount) {
            console.log(`⚠️  Insufficient ETH balance. Need ${ethers.formatEther(LIQUIDITY_AMOUNTS["WETH/SHAH"].wethAmount)} ETH, have ${ethers.formatEther(ethBalance)} ETH`);
        }

        console.log("✅ Balance check complete\n");

        // Step 1: Create new pairs using factory (with different token order)
        console.log("🏭 Step 1: Creating new pairs using factory...\n");

        const pairResults = {};

        // Helper function to create pair and add liquidity
        async function createPairAndAddLiquidity(pairName, tokenA, tokenB, amountA, amountB) {
            console.log(`   Creating ${pairName} pair...`);
            console.log(`   ${LIQUIDITY_AMOUNTS[pairName].description}`);
            
            try {
                // Check if pair already exists
                const existingPair = await factory.getPair(tokenA, tokenB);
                console.log(`   Existing pair address: ${existingPair}`);
                
                // Check if contract exists at that address
                const code = await ethers.provider.getCode(existingPair);
                if (code !== '0x') {
                    console.log(`   ✅ Pair contract already exists at ${existingPair}`);
                    return {
                        pairAddress: existingPair,
                        status: "already_exists",
                        txHash: null
                    };
                }

                // Create the pair
                console.log(`   Creating new pair...`);
                const createTx = await factory.createPair(tokenA, tokenB);
                const createReceipt = await createTx.wait();
                
                // Get the pair address from the event
                const pairCreatedEvent = createReceipt.logs.find(log => {
                    try {
                        const parsed = factory.interface.parseLog(log);
                        return parsed.name === 'PairCreated';
                    } catch (e) {
                        return false;
                    }
                });

                let pairAddress;
                if (pairCreatedEvent) {
                    const parsed = factory.interface.parseLog(pairCreatedEvent);
                    pairAddress = parsed.args.pair;
                } else {
                    // Fallback: get pair address from factory
                    pairAddress = await factory.getPair(tokenA, tokenB);
                }

                console.log(`   ✅ Pair created: ${pairAddress}`);
                console.log(`   Transaction: ${createTx.hash}`);

                return {
                    pairAddress,
                    status: "created",
                    txHash: createTx.hash,
                    receipt: createReceipt
                };

            } catch (error) {
                console.log(`   ❌ ${pairName} pair creation failed: ${error.message}`);
                return {
                    status: "failed",
                    error: error.message
                };
            }
        }

        // Create pairs with different token order
        pairResults["USDT/SHAH"] = await createPairAndAddLiquidity(
            "USDT/SHAH",
            TOKENS.USDT,
            TOKENS.SHAH,
            LIQUIDITY_AMOUNTS["USDT/SHAH"].usdtAmount,
            LIQUIDITY_AMOUNTS["USDT/SHAH"].shahAmount
        );
        console.log("");

        pairResults["DAI/SHAH"] = await createPairAndAddLiquidity(
            "DAI/SHAH",
            TOKENS.DAI,
            TOKENS.SHAH,
            LIQUIDITY_AMOUNTS["DAI/SHAH"].daiAmount,
            LIQUIDITY_AMOUNTS["DAI/SHAH"].shahAmount
        );
        console.log("");

        pairResults["WETH/SHAH"] = await createPairAndAddLiquidity(
            "WETH/SHAH",
            TOKENS.WETH,
            TOKENS.SHAH,
            LIQUIDITY_AMOUNTS["WETH/SHAH"].wethAmount,
            LIQUIDITY_AMOUNTS["WETH/SHAH"].shahAmount
        );
        console.log("");

        // Step 2: Add liquidity to pairs
        console.log("💧 Step 2: Adding liquidity to pairs...\n");

        const liquidityResults = {};

        // Helper function to add liquidity to a pair
        async function addLiquidityToPair(pairName, pairAddress, tokenA, tokenB, amountA, amountB) {
            console.log(`   Adding liquidity to ${pairName}...`);
            console.log(`   ${LIQUIDITY_AMOUNTS[pairName].description}`);
            console.log(`   Pair Address: ${pairAddress}`);
            
            try {
                // Get pair contract
                const pair = await ethers.getContractAt(pairAbi, pairAddress);
                
                // Check current reserves
                const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                console.log(`   Current reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
                
                // Get token addresses from pair
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                console.log(`   Token0: ${token0}`);
                console.log(`   Token1: ${token1}`);
                
                // Determine which token is which
                let token0Amount, token1Amount;
                if (token0 === tokenA) {
                    token0Amount = amountA;
                    token1Amount = amountB;
                } else {
                    token0Amount = amountB;
                    token1Amount = amountA;
                }

                // Approve pair to spend tokens
                const tokenAContract = await ethers.getContractAt(erc20Abi, tokenA);
                const tokenBContract = await ethers.getContractAt(erc20Abi, tokenB);
                
                console.log(`   Approving tokens for pair...`);
                
                // For USDT, set allowance to 0 first
                if (tokenA === TOKENS.USDT) {
                    await tokenAContract.approve(pairAddress, 0);
                }
                if (tokenB === TOKENS.USDT) {
                    await tokenBContract.approve(pairAddress, 0);
                }
                
                const approveATx = await tokenAContract.approve(pairAddress, amountA);
                await approveATx.wait();
                const approveBTx = await tokenBContract.approve(pairAddress, amountB);
                await approveBTx.wait();
                console.log(`   ✅ Tokens approved`);

                // Add liquidity by calling mint
                console.log(`   Adding liquidity to pair...`);
                const mintTx = await pair.mint(deployer.address);
                const mintReceipt = await mintTx.wait();
                console.log(`   ✅ Liquidity added: ${mintTx.hash}`);

                // Check new reserves
                const [newReserve0, newReserve1, newBlockTimestampLast] = await pair.getReserves();
                console.log(`   New reserves: ${ethers.formatEther(newReserve0)} / ${ethers.formatEther(newReserve1)}`);

                return {
                    pairAddress,
                    txHash: mintTx.hash,
                    receipt: mintReceipt,
                    status: "success",
                    oldReserves: { reserve0, reserve1 },
                    newReserves: { reserve0: newReserve0, reserve1: newReserve1 }
                };

            } catch (error) {
                console.log(`   ❌ ${pairName} liquidity failed: ${error.message}`);
                return {
                    status: "failed",
                    error: error.message
                };
            }
        }

        // Add liquidity to each pair
        for (const [pairName, result] of Object.entries(pairResults)) {
            if (result.status === "created" || result.status === "already_exists") {
                const liquidity = LIQUIDITY_AMOUNTS[pairName];
                
                // Determine token A and B based on pair name
                let tokenA, tokenB, amountA, amountB;
                if (pairName === "USDT/SHAH") {
                    tokenA = TOKENS.USDT;
                    tokenB = TOKENS.SHAH;
                    amountA = liquidity.usdtAmount;
                    amountB = liquidity.shahAmount;
                } else if (pairName === "DAI/SHAH") {
                    tokenA = TOKENS.DAI;
                    tokenB = TOKENS.SHAH;
                    amountA = liquidity.daiAmount;
                    amountB = liquidity.shahAmount;
                } else if (pairName === "WETH/SHAH") {
                    tokenA = TOKENS.WETH;
                    tokenB = TOKENS.SHAH;
                    amountA = liquidity.wethAmount;
                    amountB = liquidity.shahAmount;
                }
                
                liquidityResults[pairName] = await addLiquidityToPair(
                    pairName,
                    result.pairAddress,
                    tokenA,
                    tokenB,
                    amountA,
                    amountB
                );
            } else {
                console.log(`   ⏭️  Skipping liquidity for ${pairName} (pair creation failed)`);
                liquidityResults[pairName] = {
                    status: "skipped",
                    reason: "pair creation failed"
                };
            }
            console.log("");
        }

        // Step 3: Register pairs in Oracle (only if liquidity was added successfully)
        console.log("📊 Step 3: Registering pairs in Oracle...\n");

        const oracleResults = {};

        for (const [pairName, result] of Object.entries(liquidityResults)) {
            if (result.status === "success") {
                console.log(`   Registering ${pairName} in Oracle...`);
                console.log(`   Pair Address: ${result.pairAddress}`);
                
                try {
                    let token0, token1;
                    if (pairName === "WETH/SHAH") {
                        token0 = TOKENS.WETH;
                        token1 = TOKENS.SHAH;
                    } else if (pairName === "USDT/SHAH") {
                        token0 = TOKENS.USDT;
                        token1 = TOKENS.SHAH;
                    } else if (pairName === "DAI/SHAH") {
                        token0 = TOKENS.DAI;
                        token1 = TOKENS.SHAH;
                    }

                    // Check if pair is already registered
                    const isSupported = await oracle.isPairSupported(result.pairAddress);
                    if (isSupported) {
                        console.log(`   ⏭️  ${pairName} already registered in Oracle`);
                        oracleResults[pairName] = {
                            pairAddress: result.pairAddress,
                            status: "already_registered"
                        };
                        continue;
                    }

                    // Register the pair
                    const oracleTx = await oracle.addPair(result.pairAddress, token0, token1);
                    await oracleTx.wait();
                    
                    oracleResults[pairName] = {
                        pairAddress: result.pairAddress,
                        txHash: oracleTx.hash,
                        status: "success"
                    };
                    console.log(`   ✅ ${pairName} registered in Oracle: ${oracleTx.hash}`);
                    
                } catch (error) {
                    oracleResults[pairName] = {
                        pairAddress: result.pairAddress,
                        status: "failed",
                        error: error.message
                    };
                    console.log(`   ❌ Failed to register ${pairName}: ${error.message}`);
                }
            } else {
                console.log(`   ⏭️  Skipping Oracle registration for ${pairName} (liquidity addition failed)`);
                oracleResults[pairName] = {
                    status: "skipped",
                    reason: "liquidity addition failed"
                };
            }
            console.log("");
        }

        // Summary
        console.log("🎉 New Pair Creation + Liquidity Addition + Oracle Registration Complete!\n");
        
        console.log("📊 Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n🏭 Pair Creation Results:");
        for (const [pairName, result] of Object.entries(pairResults)) {
            console.log(`   ${pairName}:`);
            if (result.status === "created") {
                console.log(`     ✅ Status: Created`);
                console.log(`     Pair Address: ${result.pairAddress}`);
                console.log(`     Transaction: ${result.txHash}`);
            } else if (result.status === "already_exists") {
                console.log(`     ⏭️  Status: Already Exists`);
                console.log(`     Pair Address: ${result.pairAddress}`);
            } else {
                console.log(`     ❌ Status: Failed`);
                console.log(`     Error: ${result.error}`);
            }
        }

        console.log("\n💧 Liquidity Addition Results:");
        for (const [pairName, result] of Object.entries(liquidityResults)) {
            console.log(`   ${pairName}:`);
            if (result.status === "success") {
                console.log(`     ✅ Status: Liquidity Added`);
                console.log(`     Pair Address: ${result.pairAddress}`);
                console.log(`     Transaction: ${result.txHash}`);
                console.log(`     Old Reserves: ${ethers.formatEther(result.oldReserves.reserve0)} / ${ethers.formatEther(result.oldReserves.reserve1)}`);
                console.log(`     New Reserves: ${ethers.formatEther(result.newReserves.reserve0)} / ${ethers.formatEther(result.newReserves.reserve1)}`);
            } else if (result.status === "skipped") {
                console.log(`     ⏭️  Status: Skipped (${result.reason})`);
            } else {
                console.log(`     ❌ Status: Failed`);
                console.log(`     Error: ${result.error}`);
            }
        }

        console.log("\n📊 Oracle Registration Results:");
        for (const [pairName, result] of Object.entries(oracleResults)) {
            console.log(`   ${pairName}:`);
            if (result.status === "success") {
                console.log(`     ✅ Status: Registered`);
                console.log(`     Transaction: ${result.txHash}`);
            } else if (result.status === "already_registered") {
                console.log(`     ⏭️  Status: Already Registered`);
            } else if (result.status === "skipped") {
                console.log(`     ⏭️  Status: Skipped (${result.reason})`);
            } else {
                console.log(`     ❌ Status: Failed`);
                console.log(`     Error: ${result.error}`);
            }
        }

        console.log("\n🔗 Contract Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);

        console.log("\n📈 Next Steps:");
        console.log("   1. Verify liquidity on Etherscan");
        console.log("   2. Test TWAP price feeds");
        console.log("   3. Test swaps on the frontend");
        console.log("   4. Monitor Oracle price updates");

        // Save results to file
        const results = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            pairResults,
            liquidityResults,
            oracleResults,
            configuration: {
                factory: FACTORY,
                oracle: ORACLE,
                shahToken: SHAH_TOKEN
            }
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "new-pair-creation-liquidity-results.json"),
            JSON.stringify(results, null, 2)
        );

        console.log("\n💾 Results saved to: new-pair-creation-liquidity-results.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
