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
    console.log("🔍 Debugging Liquidity Issues...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Contract addresses
        const FACTORY = "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204";
        const ROUTER_ADDRESS = "0x49CC894c82d19FdcBDedfbF98832553749e2F73E";
        const SHAH_TOKEN = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";

        // Token addresses
        const TOKENS = {
            SHAH: SHAH_TOKEN,
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        console.log("📋 Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Router: ${ROUTER_ADDRESS}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const router = await ethers.getContractAt("ShahSwapRouterVS2", ROUTER_ADDRESS);

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

        console.log("🔍 Checking pairs and their status...\n");

        // Check each pair
        const pairs = [
            { name: "SHAH/USDT", tokenA: TOKENS.SHAH, tokenB: TOKENS.USDT },
            { name: "SHAH/DAI", tokenA: TOKENS.SHAH, tokenB: TOKENS.DAI },
            { name: "SHAH/ETH", tokenA: TOKENS.SHAH, tokenB: TOKENS.WETH }
        ];

        for (const pair of pairs) {
            console.log(`📊 Checking ${pair.name} pair...`);
            
            try {
                // Get pair address from factory
                const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
                console.log(`   Pair Address: ${pairAddress}`);
                
                if (pairAddress === "0x0000000000000000000000000000000000000000") {
                    console.log(`   ❌ Pair does not exist`);
                    
                    // Try to create the pair
                    console.log(`   🔧 Attempting to create pair...`);
                    try {
                        const createTx = await factory.createPair(pair.tokenA, pair.tokenB);
                        await createTx.wait();
                        console.log(`   ✅ Pair created: ${createTx.hash}`);
                        
                        // Get new pair address
                        const newPairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
                        console.log(`   New Pair Address: ${newPairAddress}`);
                        
                    } catch (createError) {
                        console.log(`   ❌ Pair creation failed: ${createError.message}`);
                    }
                } else {
                    // Check if contract exists at pair address
                    const code = await ethers.provider.getCode(pairAddress);
                    if (code === '0x') {
                        console.log(`   ❌ No contract deployed at pair address (phantom pair)`);
                    } else {
                        console.log(`   ✅ Pair contract exists`);
                        
                        // Get pair info
                        const pairContract = await ethers.getContractAt(pairAbi, pairAddress);
                        const token0 = await pairContract.token0();
                        const token1 = await pairContract.token1();
                        const [reserve0, reserve1, blockTimestampLast] = await pairContract.getReserves();
                        const totalSupply = await pairContract.totalSupply();
                        
                        console.log(`   Token0: ${token0}`);
                        console.log(`   Token1: ${token1}`);
                        console.log(`   Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
                        console.log(`   Total Supply: ${ethers.formatEther(totalSupply)}`);
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ Error checking pair: ${error.message}`);
            }
            
            console.log("");
        }

        console.log("🔍 Checking token balances and allowances...\n");

        // Check token balances
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
        const daiToken = await ethers.getContractAt(erc20Abi, TOKENS.DAI);

        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI Balance: ${ethers.formatEther(daiBalance)} DAI`);
        console.log(`   ETH Balance: ${ethers.formatEther(ethBalance)} ETH`);

        // Check allowances
        const shahAllowance = await shahToken.allowance(deployer.address, ROUTER_ADDRESS);
        const usdtAllowance = await usdtToken.allowance(deployer.address, ROUTER_ADDRESS);
        const daiAllowance = await daiToken.allowance(deployer.address, ROUTER_ADDRESS);

        console.log(`\n   SHAH Allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
        console.log(`   USDT Allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);
        console.log(`   DAI Allowance: ${ethers.formatEther(daiAllowance)} DAI`);

        console.log("\n💡 Recommendations:");
        
        if (ethBalance < ethers.parseEther("0.01")) {
            console.log("   • Add more ETH to wallet for SHAH/ETH liquidity");
        }
        
        if (usdtBalance < ethers.parseUnits("20", 6)) {
            console.log("   • Add more USDT to wallet for SHAH/USDT liquidity");
        }
        
        if (daiBalance < ethers.parseEther("3")) {
            console.log("   • Add more DAI to wallet for SHAH/DAI liquidity");
        }

        console.log("   • Check if pairs need to be created or initialized");
        console.log("   • Verify router has correct factory and WETH addresses");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Stack trace:", error.stack);
        process.exit(1);
    }
}

main().catch(console.error);
