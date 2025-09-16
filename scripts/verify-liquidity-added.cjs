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
    console.log("🔍 Verifying Liquidity Addition...\n");

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

        // Deployed pair address
        const DEPLOYED_PAIR = "0x0F1fbE452618fFc8ddb6097C2ff96f1c77BCA45C";

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}`);
        console.log(`   Deployed Pair: ${DEPLOYED_PAIR}\n`);

        // ERC20 ABI
        const erc20Abi = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function totalSupply() view returns (uint256)"
        ];

        // Pair ABI
        const pairAbi = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
            "function totalSupply() external view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);

        console.log("🔍 Checking Pair Contract Status...\n");

        try {
            // Get pair contract
            const pair = await ethers.getContractAt(pairAbi, DEPLOYED_PAIR);
            
            console.log(`   Checking pair contract at: ${DEPLOYED_PAIR}`);
            
            // Check if contract exists
            const code = await ethers.provider.getCode(DEPLOYED_PAIR);
            if (code === '0x') {
                console.log(`   ❌ No contract deployed at this address`);
                return;
            }
            console.log(`   ✅ Contract exists at this address`);
            
            // Get token addresses from pair
            const token0 = await pair.token0();
            const token1 = await pair.token1();
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            
            // Check if tokens are properly set
            if (token0 === ethers.ZeroAddress || token1 === ethers.ZeroAddress) {
                console.log(`   ❌ Pair not properly initialized - tokens are zero address`);
                return;
            }
            console.log(`   ✅ Pair is properly initialized`);
            
            // Check current reserves
            const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
            console.log(`   Reserve0: ${ethers.formatEther(reserve0)}`);
            console.log(`   Reserve1: ${ethers.formatEther(reserve1)}`);
            console.log(`   Block Timestamp: ${blockTimestampLast}`);
            
            // Check total supply of LP tokens
            const totalSupply = await pair.totalSupply();
            console.log(`   Total LP Token Supply: ${ethers.formatEther(totalSupply)}`);
            
            // Check deployer's LP token balance
            const deployerLpBalance = await pair.balanceOf(deployer.address);
            console.log(`   Deployer LP Balance: ${ethers.formatEther(deployerLpBalance)}`);
            
            // Determine which token is which
            let shahReserve, usdtReserve;
            if (token0 === TOKENS.SHAH) {
                shahReserve = reserve0;
                usdtReserve = reserve1;
            } else {
                shahReserve = reserve1;
                usdtReserve = reserve0;
            }
            
            console.log(`\n📊 Liquidity Analysis:`);
            console.log(`   SHAH Reserve: ${ethers.formatEther(shahReserve)} SHAH`);
            console.log(`   USDT Reserve: ${ethers.formatUnits(usdtReserve, 6)} USDT`);
            
            // Check if liquidity was actually added
            if (shahReserve > 0 && usdtReserve > 0) {
                console.log(`   ✅ LIQUIDITY WAS SUCCESSFULLY ADDED!`);
                console.log(`   ✅ Pair has ${ethers.formatEther(shahReserve)} SHAH and ${ethers.formatUnits(usdtReserve, 6)} USDT`);
            } else {
                console.log(`   ❌ NO LIQUIDITY FOUND`);
                console.log(`   ❌ Reserves are zero - liquidity was not added`);
            }
            
            // Check if deployer has LP tokens
            if (deployerLpBalance > 0) {
                console.log(`   ✅ Deployer has ${ethers.formatEther(deployerLpBalance)} LP tokens`);
            } else {
                console.log(`   ❌ Deployer has no LP tokens`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error checking pair contract: ${error.message}`);
            return;
        }

        console.log("\n🔍 Checking Oracle Registration...\n");

        try {
            // Get Oracle contract
            const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);
            
            // Check if pair is registered in Oracle
            const isSupported = await oracle.isPairSupported(DEPLOYED_PAIR);
            if (isSupported) {
                console.log(`   ✅ Pair is registered in Oracle`);
            } else {
                console.log(`   ❌ Pair is NOT registered in Oracle`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error checking Oracle: ${error.message}`);
        }

        console.log("\n📊 Final Verification Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        // Final assessment
        try {
            const pair = await ethers.getContractAt(pairAbi, DEPLOYED_PAIR);
            const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
            const totalSupply = await pair.totalSupply();
            const deployerLpBalance = await pair.balanceOf(deployer.address);
            
            if (reserve0 > 0 && reserve1 > 0 && deployerLpBalance > 0) {
                console.log("\n🎉 SUCCESS: Liquidity was successfully added!");
                console.log("   • Pair contract is deployed and initialized");
                console.log("   • Reserves contain tokens");
                console.log("   • Deployer has LP tokens");
                console.log("   • ShahSwap is ready for trading!");
            } else {
                console.log("\n❌ ISSUE: Liquidity was not successfully added");
                console.log("   • Pair contract exists but has no liquidity");
                console.log("   • Need to retry liquidity addition");
            }
            
        } catch (error) {
            console.log(`\n❌ ERROR: Could not verify liquidity status: ${error.message}`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
