const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🖥️  Updating Frontend Configuration for SHAH Ecosystem...\n");
    console.log("=" .repeat(60));

    // Contract addresses
    const CONTRACTS = {
        ROUTER_V2: "0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C",
        ORACLE: "0x3712f346f2538E2101D38F23db1B7aC382eAD30D",
        FACTORY: "0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204",
        SHAH: "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8",
        STAKING: "0xe6d1b29ccfd7b65c94d30cc22db8be88629ccc00",
        AUTOCLAIM: "0x59d4De06A62C7c7EEFC9eFee70665E4e55c84095",
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

    console.log("📋 Current Contract Addresses:");
    console.log(`   Router V2: ${CONTRACTS.ROUTER_V2}`);
    console.log(`   Oracle: ${CONTRACTS.ORACLE}`);
    console.log(`   Factory: ${CONTRACTS.FACTORY}`);
    console.log(`   SHAH Token: ${CONTRACTS.SHAH}`);
    console.log(`   Staking: ${CONTRACTS.STAKING}`);
    console.log(`   AutoClaim: ${CONTRACTS.AUTOCLAIM}`);
    console.log(`   Treasury: ${CONTRACTS.TREASURY}\n`);

    console.log("🔄 LP Pairs:");
    for (const [name, address] of Object.entries(LP_PAIRS)) {
        console.log(`   ${name}: ${address}`);
    }
    console.log();

    try {
        // Update environment variables
        console.log("📝 Updating environment variables...");
        const fs = require("fs");
        const path = require("path");
        const envPath = path.join(__dirname, "..", ".env.local");
        let envContent = "";
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, "utf8");
        }

        // Add or update environment variables
        const updates = {
            "NEXT_PUBLIC_SHAHSWAP_ROUTER": CONTRACTS.ROUTER_V2,
            "NEXT_PUBLIC_SHAHSWAP_ORACLE": CONTRACTS.ORACLE,
            "NEXT_PUBLIC_SHAHSWAP_FACTORY": CONTRACTS.FACTORY,
            "NEXT_PUBLIC_SHAH": CONTRACTS.SHAH,
            "NEXT_PUBLIC_STAKING": CONTRACTS.STAKING,
            "AUTOCLAIM_EXECUTOR_ADDRESS": CONTRACTS.AUTOCLAIM,
            "TREASURY_ADDRESS": CONTRACTS.TREASURY
        };

        for (const [key, value] of Object.entries(updates)) {
            const regex = new RegExp(`^${key}=.*`, "m");
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, `${key}=${value}`);
            } else {
                envContent += `\n${key}=${value}`;
            }
        }

        fs.writeFileSync(envPath, envContent);
        console.log("   ✅ Environment variables updated");

        // Create frontend configuration file
        console.log("\n📄 Creating frontend configuration...");
        const frontendConfig = {
            network: "mainnet",
            chainId: 1,
            contracts: {
                router: CONTRACTS.ROUTER_V2,
                oracle: CONTRACTS.ORACLE,
                factory: CONTRACTS.FACTORY,
                shah: CONTRACTS.SHAH,
                staking: CONTRACTS.STAKING,
                autoClaim: CONTRACTS.AUTOCLAIM,
                treasury: CONTRACTS.TREASURY
            },
            tokens: TOKENS,
            pairs: LP_PAIRS,
            rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key",
            blockExplorer: "https://etherscan.io",
            updatedAt: new Date().toISOString()
        };

        const configPath = path.join(__dirname, "..", "frontend-config.json");
        fs.writeFileSync(configPath, JSON.stringify(frontendConfig, null, 2));
        console.log(`   ✅ Frontend config saved to: ${configPath}`);

        // Create TypeScript constants file
        console.log("\n📄 Creating TypeScript constants...");
        const tsConstants = `// SHAH Ecosystem Contract Addresses
// Auto-generated on ${new Date().toISOString()}

export const SHAH_CONTRACTS = {
  ROUTER_V2: "${CONTRACTS.ROUTER_V2}",
  ORACLE: "${CONTRACTS.ORACLE}",
  FACTORY: "${CONTRACTS.FACTORY}",
  SHAH: "${CONTRACTS.SHAH}",
  STAKING: "${CONTRACTS.STAKING}",
  AUTOCLAIM: "${CONTRACTS.AUTOCLAIM}",
  TREASURY: "${CONTRACTS.TREASURY}",
} as const;

export const SHAH_TOKENS = {
  SHAH: "${TOKENS.SHAH}",
  WETH: "${TOKENS.WETH}",
  USDC: "${TOKENS.USDC}",
  USDT: "${TOKENS.USDT}",
  DAI: "${TOKENS.DAI}",
} as const;

export const SHAH_PAIRS = {
  "SHAH-ETH": "${LP_PAIRS["SHAH-ETH"]}",
  "SHAH-USDC": "${LP_PAIRS["SHAH-USDC"]}",
  "SHAH-USDT": "${LP_PAIRS["SHAH-USDT"]}",
  "SHAH-DAI": "${LP_PAIRS["SHAH-DAI"]}",
} as const;

export const SHAH_NETWORK = {
  chainId: 1,
  name: "Ethereum Mainnet",
  rpcUrl: "${process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/your-api-key"}",
  blockExplorer: "https://etherscan.io",
} as const;
`;

        const tsPath = path.join(__dirname, "..", "src", "config", "shah-constants.ts");
        const tsDir = path.dirname(tsPath);
        if (!fs.existsSync(tsDir)) {
            fs.mkdirSync(tsDir, { recursive: true });
        }
        fs.writeFileSync(tsPath, tsConstants);
        console.log(`   ✅ TypeScript constants saved to: ${tsPath}`);

        // Create frontend integration guide
        console.log("\n📄 Creating frontend integration guide...");
        const integrationGuide = `# SHAH Ecosystem Frontend Integration Guide

## Overview
This guide provides instructions for integrating the SHAH ecosystem contracts into your frontend application.

## Contract Addresses

### Core Contracts
- **Router V2**: ${CONTRACTS.ROUTER_V2}
- **Oracle**: ${CONTRACTS.ORACLE}
- **Factory**: ${CONTRACTS.FACTORY}
- **SHAH Token**: ${CONTRACTS.SHAH}
- **Staking**: ${CONTRACTS.STAKING}
- **AutoClaim**: ${CONTRACTS.AUTOCLAIM}
- **Treasury**: ${CONTRACTS.TREASURY}

### LP Pairs
${Object.entries(LP_PAIRS).map(([name, addr]) => `- **${name}**: ${addr}`).join('\n')}

## Environment Variables
Add these to your \`.env.local\` file:

\`\`\`env
NEXT_PUBLIC_SHAHSWAP_ROUTER=${CONTRACTS.ROUTER_V2}
NEXT_PUBLIC_SHAHSWAP_ORACLE=${CONTRACTS.ORACLE}
NEXT_PUBLIC_SHAHSWAP_FACTORY=${CONTRACTS.FACTORY}
NEXT_PUBLIC_SHAH=${CONTRACTS.SHAH}
NEXT_PUBLIC_STAKING=${CONTRACTS.STAKING}
AUTOCLAIM_EXECUTOR_ADDRESS=${CONTRACTS.AUTOCLAIM}
TREASURY_ADDRESS=${CONTRACTS.TREASURY}
\`\`\`

## Usage Examples

### 1. Swap Functionality
\`\`\`typescript
import { SHAH_CONTRACTS, SHAH_TOKENS } from '@/config/shah-constants';

// Get swap quote
const amountIn = ethers.parseEther("100"); // 100 SHAH
const path = [SHAH_TOKENS.SHAH, SHAH_TOKENS.WETH];
const amountsOut = await router.getAmountsOut(amountIn, path);

// Execute swap
const swapTx = await router.swapExactTokensForTokens(
  amountIn,
  amountsOut[1],
  path,
  userAddress,
  deadline
);
\`\`\`

### 2. Oracle Price Feeds
\`\`\`typescript
import { SHAH_CONTRACTS, SHAH_PAIRS } from '@/config/shah-constants';

// Get SHAH/ETH price
const shahEthPair = SHAH_PAIRS["SHAH-ETH"];
const price = await oracle.consult(shahEthPair, ethers.parseEther("1"));
\`\`\`

### 3. Staking Integration
\`\`\`typescript
import { SHAH_CONTRACTS } from '@/config/shah-constants';

// Stake SHAH tokens
const stakeAmount = ethers.parseEther("1000");
const stakeTx = await staking.stake(stakeAmount);

// Claim rewards
const claimTx = await staking.claimRewards();
\`\`\`

### 4. AutoClaim Integration
\`\`\`typescript
import { SHAH_CONTRACTS } from '@/config/shah-constants';

// Execute auto-claim
const autoClaimTx = await autoClaim.executeAutoClaim(userAddress);
\`\`\`

## Important Notes

1. **Liquidity**: LP pairs need initial liquidity before swaps can be executed
2. **Oracle Registration**: Pairs must be registered with the Oracle for price feeds
3. **Gas Optimization**: Use the Router V2's batch functions for multiple operations
4. **Error Handling**: Always handle insufficient liquidity errors gracefully

## Testing

1. Test swap quotes before executing transactions
2. Verify Oracle price feeds are working
3. Test staking and reward claiming functionality
4. Ensure proper error handling for edge cases

## Support

For technical support, refer to the contract documentation and Etherscan links:
- Router V2: https://etherscan.io/address/${CONTRACTS.ROUTER_V2}
- Oracle: https://etherscan.io/address/${CONTRACTS.ORACLE}
- Factory: https://etherscan.io/address/${CONTRACTS.FACTORY}
`;

        const guidePath = path.join(__dirname, "..", "FRONTEND_INTEGRATION_GUIDE.md");
        fs.writeFileSync(guidePath, integrationGuide);
        console.log(`   ✅ Integration guide saved to: ${guidePath}`);

        // Summary
        console.log("\n🎉 Frontend Configuration Update Complete!");
        console.log("\n📋 Files Created/Updated:");
        console.log(`   ✅ .env.local - Environment variables updated`);
        console.log(`   ✅ frontend-config.json - Configuration file`);
        console.log(`   ✅ src/config/shah-constants.ts - TypeScript constants`);
        console.log(`   ✅ FRONTEND_INTEGRATION_GUIDE.md - Integration guide`);

        console.log("\n🔗 Key Contract Links:");
        console.log(`   Router V2: https://etherscan.io/address/${CONTRACTS.ROUTER_V2}`);
        console.log(`   Oracle: https://etherscan.io/address/${CONTRACTS.ORACLE}`);
        console.log(`   Factory: https://etherscan.io/address/${CONTRACTS.FACTORY}`);
        console.log(`   SHAH Token: https://etherscan.io/address/${CONTRACTS.SHAH}`);

        console.log("\n💡 Next Steps:");
        console.log("   1. Import the TypeScript constants in your frontend");
        console.log("   2. Update your swap components to use Router V2");
        console.log("   3. Integrate Oracle price feeds");
        console.log("   4. Test all functionality with the new contracts");
        console.log("   5. Add initial liquidity to LP pairs when ready");

        console.log("\n🚀 Your frontend is now ready to use the new SHAH ecosystem!");

    } catch (error) {
        console.error("❌ Frontend configuration update failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

