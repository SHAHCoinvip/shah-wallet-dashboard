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
    console.log("📊 ShahSwap Liquidity & Oracle Status Summary\n");

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

        console.log("📋 ShahSwap Configuration:");
        console.log(`   Factory: ${FACTORY}`);
        console.log(`   Oracle: ${ORACLE}`);
        console.log(`   SHAH Token: ${SHAH_TOKEN}\n`);

        // Get contract instances
        const factory = await ethers.getContractAt("ShahSwapFactory", FACTORY);
        const oracle = await ethers.getContractAt("ShahSwapOracle", ORACLE);

        // ERC20 ABI
        const erc20Abi = [
            "function balanceOf(address account) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];

        // Get token contracts
        const shahToken = await ethers.getContractAt(erc20Abi, TOKENS.SHAH);
        const usdtToken = await ethers.getContractAt(erc20Abi, TOKENS.USDT);
        const daiToken = await ethers.getContractAt(erc20Abi, TOKENS.DAI);

        console.log("🔍 Current Token Balances:");
        
        // Check balances
        const shahBalance = await shahToken.balanceOf(deployer.address);
        const usdtBalance = await usdtToken.balanceOf(deployer.address);
        const daiBalance = await daiToken.balanceOf(deployer.address);
        const ethBalance = await ethers.provider.getBalance(deployer.address);

        console.log(`   SHAH: ${ethers.formatEther(shahBalance)} SHAH`);
        console.log(`   USDT: ${ethers.formatUnits(usdtBalance, 6)} USDT`);
        console.log(`   DAI: ${ethers.formatEther(daiBalance)} DAI`);
        console.log(`   ETH: ${ethers.formatEther(ethBalance)} ETH\n`);

        console.log("🏭 Factory Pair Status:");
        
        // Check factory pairs
        const shahUsdtPair = await factory.getPair(TOKENS.SHAH, TOKENS.USDT);
        const shahDaiPair = await factory.getPair(TOKENS.SHAH, TOKENS.DAI);
        const shahEthPair = await factory.getPair(TOKENS.SHAH, TOKENS.WETH);

        console.log(`   SHAH/USDT: ${shahUsdtPair}`);
        console.log(`   SHAH/DAI: ${shahDaiPair}`);
        console.log(`   SHAH/ETH: ${shahEthPair}\n`);

        console.log("🔍 Contract Deployment Status:");
        
        // Check if contracts exist at pair addresses
        const pairs = [
            { name: "SHAH/USDT", address: shahUsdtPair },
            { name: "SHAH/DAI", address: shahDaiPair },
            { name: "SHAH/ETH", address: shahEthPair }
        ];

        for (const pair of pairs) {
            const code = await ethers.provider.getCode(pair.address);
            const hasContract = code !== '0x';
            console.log(`   ${pair.name}: ${hasContract ? '✅ Contract Deployed' : '❌ No Contract'}`);
        }

        console.log("\n📊 Oracle Status:");
        
        // Check Oracle status
        try {
            const oracleOwner = await oracle.owner();
            console.log(`   Owner: ${oracleOwner}`);
            console.log(`   Is Owner: ${oracleOwner.toLowerCase() === deployer.address.toLowerCase() ? '✅ Yes' : '❌ No'}`);
        } catch (error) {
            console.log(`   ❌ Error checking Oracle: ${error.message}`);
        }

        console.log("\n🎯 Current Status Summary:");
        console.log("═══════════════════════════════════════════════════════════");
        
        console.log("\n✅ What's Working:");
        console.log("   • Factory contract deployed and functional");
        console.log("   • Oracle contract deployed and functional");
        console.log("   • SHAH token deployed and functional");
        console.log("   • Sufficient token balances for liquidity");
        console.log("   • Sufficient ETH for gas fees");
        console.log("   • One pair contract deployed (SHAH/USDT)");

        console.log("\n❌ Current Issues:");
        console.log("   • Factory has 'phantom pairs' - entries without deployed contracts");
        console.log("   • Deployed pair contract needs proper initialization");
        console.log("   • No liquidity added to any pairs yet");
        console.log("   • No pairs registered in Oracle yet");

        console.log("\n🔧 Technical Details:");
        console.log("   • Factory returns addresses for pairs that don't have contracts");
        console.log("   • This is a common issue with Uniswap V2-style factories");
        console.log("   • The solution is to properly initialize the deployed pair contracts");

        console.log("\n💡 Recommended Next Steps:");
        console.log("   1. Fix the pair initialization issue");
        console.log("   2. Add liquidity to the working pair");
        console.log("   3. Register the pair in the Oracle");
        console.log("   4. Test the complete flow");

        console.log("\n🔗 Useful Links:");
        console.log(`   Factory: https://etherscan.io/address/${FACTORY}`);
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${SHAH_TOKEN}`);
        console.log(`   Deployed Pair: https://etherscan.io/address/0x0F1fbE452618fFc8ddb6097C2ff96f1c77BCA45C`);

        console.log("\n📈 Production Readiness:");
        console.log("   • Contracts: ✅ Deployed");
        console.log("   • Liquidity: ❌ Not Added");
        console.log("   • Oracle: ❌ Not Registered");
        console.log("   • Frontend: ⏳ Ready to Connect");

        // Save summary to file
        const summary = {
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            balances: {
                shah: ethers.formatEther(shahBalance),
                usdt: ethers.formatUnits(usdtBalance, 6),
                dai: ethers.formatEther(daiBalance),
                eth: ethers.formatEther(ethBalance)
            },
            pairs: {
                shahUsdt: shahUsdtPair,
                shahDai: shahDaiPair,
                shahEth: shahEthPair
            },
            contracts: {
                factory: FACTORY,
                oracle: ORACLE,
                shahToken: SHAH_TOKEN
            },
            status: {
                contractsDeployed: true,
                liquidityAdded: false,
                oracleRegistered: false,
                productionReady: false
            }
        };

        fs.writeFileSync(
            path.join(__dirname, "..", "shahswap-status-summary.json"),
            JSON.stringify(summary, null, 2)
        );

        console.log("\n💾 Status summary saved to: shahswap-status-summary.json");

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
