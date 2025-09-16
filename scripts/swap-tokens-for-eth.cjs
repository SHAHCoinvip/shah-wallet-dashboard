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
    console.log("💱 Swapping Tokens for ETH...\n");

    try {
        // Get deployer account
        const [deployer] = await ethers.getSigners();
        if (!deployer) {
            throw new Error("No deployer account found. Check PRIVATE_KEY in .env.local");
        }
        console.log(`📋 Using account: ${deployer.address}`);
        console.log(`💰 Account balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

        // Token addresses
        const TOKENS = {
            USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
            WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
        };

        // Uniswap V2 Router (for swapping)
        const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

        console.log("📋 Configuration:");
        console.log(`   Uniswap V2 Router: ${UNISWAP_V2_ROUTER}`);
        console.log(`   USDT: ${TOKENS.USDT}`);
        console.log(`   DAI: ${TOKENS.DAI}`);
        console.log(`   WETH: ${TOKENS.WETH}\n`);

        // Get token contracts
        const erc20Abi = [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
        const daiToken = await ethers.getContractAt(erc20Abi, TOKENS.DAI);

        // Check balances
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);

        console.log("🔍 Current Token Balances:");
        console.log(`   USDT: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI: ${ethers.formatEther(daiBalance)} DAI\n`);

        // Suggest swap amounts
        const suggestedUsdtSwap = ethers.parseUnits("5", 6); // 5 USDT
        const suggestedDaiSwap = ethers.parseEther("2"); // 2 DAI

        console.log("💡 Suggested Swap Amounts:");
        console.log(`   Swap 5 USDT for ETH`);
        console.log(`   Swap 2 DAI for ETH`);
        console.log(`   This should give you ~0.01-0.02 ETH for gas fees\n`);

        console.log("📝 Manual Swap Instructions:");
        console.log("1. Go to Uniswap: https://app.uniswap.org/");
        console.log("2. Connect your wallet");
        console.log("3. Select USDT → ETH");
        console.log("4. Enter amount: 5 USDT");
        console.log("5. Click Swap");
        console.log("6. Repeat for DAI → ETH (2 DAI)");
        console.log("7. Or use 1inch: https://1inch.io/ for better rates\n");

        console.log("🔗 Direct Links:");
        console.log(`   Uniswap USDT→ETH: https://app.uniswap.org/#/swap?inputCurrency=${TOKENS.USDT}&outputCurrency=ETH`);
        console.log(`   Uniswap DAI→ETH: https://app.uniswap.org/#/swap?inputCurrency=${TOKENS.DAI}&outputCurrency=ETH`);
        console.log(`   1inch: https://1inch.io/`);

        console.log("\n📈 After Getting ETH:");
        console.log("1. Run: npx hardhat run scripts/deploy-pairs-create2.cjs --network mainnet");
        console.log("2. This will deploy pairs, add liquidity, and register in Oracle");
        console.log("3. Your ShahSwap will be ready for production!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
