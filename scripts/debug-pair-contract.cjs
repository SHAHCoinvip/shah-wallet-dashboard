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
    console.log("🔍 Debugging Pair Contract...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}\n`);

        // Deployed pair address
        const DEPLOYED_PAIR = "0x0F1fbE452618fFc8ddb6097C2ff96f1c77BCA45C";

        // Token addresses
        const TOKENS = {
            SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        };

        console.log("📋 Configuration:");
        console.log(`   Deployed Pair: ${DEPLOYED_PAIR}\n`);

        // Get the contract code
        const code = await ethers.provider.getCode(DEPLOYED_PAIR);
        console.log(`🔍 Contract Code Length: ${code.length} characters`);
        console.log(`   Code exists: ${code !== '0x' ? '✅ Yes' : '❌ No'}\n`);

        if (code === '0x') {
            console.log("❌ No contract deployed at this address");
            return;
        }

        // Try different ABIs to see which one works
        const abis = {
            "Standard Pair": [
                "function mint(address to) external returns (uint256 liquidity)",
                "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
                "function totalSupply() external view returns (uint256)"
            ],
            "ShahSwap Pair": [
                "function mint(address to) external returns (uint256 liquidity)",
                "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
                "function totalSupply() external view returns (uint256)",
                "function initialize(address _token0, address _token1) external"
            ],
            "Uniswap V2 Pair": [
                "function mint(address to) external returns (uint256 liquidity)",
                "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                "function token0() external view returns (address)",
                "function token1() external view returns (address)",
                "function totalSupply() external view returns (uint256)",
                "function sync() external"
            ]
        };

        console.log("🔍 Testing Different ABIs...\n");

        for (const [abiName, abi] of Object.entries(abis)) {
            try {
                console.log(`   Testing ${abiName} ABI...`);
                const pair = await ethers.getContractAt(abi, DEPLOYED_PAIR);
                
                // Test basic functions
                const token0 = await pair.token0();
                const token1 = await pair.token1();
                const [reserve0, reserve1, blockTimestampLast] = await pair.getReserves();
                const totalSupply = await pair.totalSupply();
                
                console.log(`     ✅ ${abiName} ABI works!`);
                console.log(`     Token0: ${token0}`);
                console.log(`     Token1: ${token1}`);
                console.log(`     Reserves: ${ethers.formatEther(reserve0)} / ${ethers.formatEther(reserve1)}`);
                console.log(`     Total Supply: ${ethers.formatEther(totalSupply)}`);
                
                // Test if mint function exists and what it expects
                try {
                    console.log(`     Testing mint function...`);
                    
                    // Check if we can call mint (this will fail but tell us the error)
                    await pair.mint.staticCall(deployer.address);
                    console.log(`     ✅ Mint function callable`);
                    
                } catch (mintError) {
                    console.log(`     ❌ Mint function error: ${mintError.message}`);
                    
                    // Try to understand what the mint function expects
                    if (mintError.message.includes("INSUFFICIENT_LIQUIDITY_MINTED")) {
                        console.log(`     💡 This suggests the pair expects liquidity to be added differently`);
                    } else if (mintError.message.includes("INSUFFICIENT_INPUT_AMOUNT")) {
                        console.log(`     💡 This suggests the pair expects different input amounts`);
                    } else if (mintError.message.includes("TRANSFER_FAILED")) {
                        console.log(`     💡 This suggests a token transfer issue`);
                    }
                }
                
                console.log("");
                break; // Use the first working ABI
                
            } catch (error) {
                console.log(`     ❌ ${abiName} ABI failed: ${error.message}`);
            }
        }

        console.log("🔍 Checking Token Allowances...\n");

        // Check token allowances
        const erc20Abi = [
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)"
        ];

        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);

        const shahAllowance = await shahToken.allowance(deployer.address, DEPLOYED_PAIR);
        const usdtAllowance = await usdtToken.allowance(deployer.address, DEPLOYED_PAIR);
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);

        console.log(`   SHAH Balance: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   SHAH Allowance: ${ethers.formatEther(shahAllowance)} SHAH`);
        console.log(`   USDT Balance: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   USDT Allowance: ${ethers.formatUnits(usdtAllowance, 6)} USDT`);

        console.log("\n💡 Recommendations:");
        if (shahAllowance === 0n || usdtAllowance === 0n) {
            console.log("   • Need to approve tokens for the pair");
        }
        if (shahBalance < ethers.parseEther("3.33") || usdtBalance < ethers.parseUnits("10", 6)) {
            console.log("   • Insufficient token balance");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
