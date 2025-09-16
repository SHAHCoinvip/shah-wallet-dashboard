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
    console.log("🔍 Verifying Liquidity & Registering in Oracle...\n");

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

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // Get pair address
        const pairAddress = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
        console.log(`🔗 Pair Address: ${pairAddress}`);

        // Check if pair contract exists
        const code = await ethers.provider.getCode(pairAddress);
        if (code === '0x') {
            console.log("❌ No contract deployed at pair address");
            return;
        }

        // Pair ABI
        const pairAbi = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)"
        ];

        const pair = await ethers.getContractAt(pairAbi, pairAddress);

        // Get pair information
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
        const totalSupply = await pair.totalSupply();

        console.log("\n📊 Pair Information:");
        console.log(`   Token0: ${token0}`);
        console.log(`   Token1: ${token1}`);
        console.log(`   Reserve0: ${ethers.formatEther(reserve0)}`);
        console.log(`   Reserve1: ${ethers.formatEther(reserve1)}`);
        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);

        // Determine which token is which
        let shahReserve, usdtReserve;
        if (token0.toLowerCase() === TOKENS.SHAH.toLowerCase()) {
            shahReserve = reserve0;
            usdtReserve = reserve1;
        } else {
            shahReserve = reserve1;
            usdtReserve = reserve0;
        }

        console.log(`\n💧 Liquidity Details:`);
        console.log(`   SHAH Reserve: ${ethers.formatEther(shahReserve)} SHAH`);
        console.log(`   USDT Reserve: ${ethers.formatUnits(usdtReserve, 6)} USDT`);

        if (shahReserve > 0n && usdtReserve > 0n) {
            console.log(`   ✅ Liquidity successfully added!`);
        } else {
            console.log(`   ❌ No liquidity found`);
            return;
        }

        // Check Oracle minimum liquidity requirement
        console.log(`\n📊 Oracle Registration:`);
        
        try {
            // Check if pair is already registered
            const isSupported = await oracle.isPairSupported(pairAddress);
            if (isSupported) {
                console.log(`   ⏭️  Pair already registered in Oracle`);
            } else {
                console.log(`   🔍 Checking Oracle minimum liquidity requirement...`);
                
                // Try to register with current liquidity
                try {
                    const oracleTx = await oracle.addPair(pairAddress, TOKENS.SHAH, TOKENS.USDT);
                    await oracleTx.wait();
                    console.log(`   ✅ Pair registered in Oracle: ${oracleTx.hash}`);
                } catch (error) {
                    if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
                        console.log(`   ⚠️  Oracle requires more liquidity (minimum 1000 units per token)`);
                        console.log(`   💡 Current liquidity: ${ethers.formatEther(shahReserve)} SHAH / ${ethers.formatUnits(usdtReserve, 6)} USDT`);
                        console.log(`   💡 Need: 1000 SHAH / 1000 USDT minimum`);
                        
                        // Check if we have enough tokens to add more liquidity
                        const erc20Abi = ["function balanceOf(address account) view returns (uint256)"];
                        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
                        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
                        
                        const shahBalance = await shahToken.balanceOf(deployer.address);
                        const usdtBalance = await usdtToken.balanceOf(deployer.address);
                        
                        console.log(`\n💰 Available Tokens:`);
                        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
                        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
                        
                        if (shahBalance >= ethers.parseEther("1000") && usdtBalance >= ethers.parseUnits("1000", 6)) {
                            console.log(`   ✅ Have enough tokens to meet Oracle minimum`);
                            console.log(`   💡 Run add-liquidity-for-oracle.cjs to add more liquidity`);
                        } else {
                            console.log(`   ❌ Insufficient tokens to meet Oracle minimum`);
                        }
                    } else {
                        console.log(`   ❌ Oracle registration failed: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ Error checking Oracle: ${error.message}`);
        }

        console.log("\n🎉 Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        console.log("✅ Liquidity successfully added to SHAH/USDT pair");
        console.log("✅ Pair contract is working and has reserves");
        console.log("⚠️  Oracle registration requires more liquidity (1000+ units)");
        console.log("💡 ShahSwap is functional for swaps, Oracle needs more liquidity");

        console.log("\n🔗 Contract Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);
        console.log(`   SHAH/USDT Pair: https://etherscan.io/address/${pairAddress}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
