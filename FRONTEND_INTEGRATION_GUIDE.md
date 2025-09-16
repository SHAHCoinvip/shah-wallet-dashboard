# SHAH Ecosystem Frontend Integration Guide

## Overview
This guide provides instructions for integrating the SHAH ecosystem contracts into your frontend application.

## Contract Addresses

### Core Contracts
- **Router V2**: 0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C
- **Oracle**: 0x3712f346f2538E2101D38F23db1B7aC382eAD30D
- **Factory**: 0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204
- **SHAH Token**: 0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
- **Staking**: 0xe6d1b29ccfd7b65c94d30cc22db8be88629ccc00
- **AutoClaim**: 0x59d4De06A62C7c7EEFC9eFee70665E4e55c84095
- **Treasury**: 0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4

### LP Pairs
- **SHAH-ETH**: 0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e
- **SHAH-USDC**: 0x6f31E71925572E51c38c468188aAE117c993f6F8
- **SHAH-USDT**: 0x4c741106D435a6167d1117B1f37f1Eb584639C66
- **SHAH-DAI**: 0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048

## Environment Variables
Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SHAHSWAP_ROUTER=0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C
NEXT_PUBLIC_SHAHSWAP_ORACLE=0x3712f346f2538E2101D38F23db1B7aC382eAD30D
NEXT_PUBLIC_SHAHSWAP_FACTORY=0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204
NEXT_PUBLIC_SHAH=0x6E0cFA42F797E316ff147A21f7F1189cd610ede8
NEXT_PUBLIC_STAKING=0xe6d1b29ccfd7b65c94d30cc22db8be88629ccc00
AUTOCLAIM_EXECUTOR_ADDRESS=0x59d4De06A62C7c7EEFC9eFee70665E4e55c84095
TREASURY_ADDRESS=0xF53Bedb68675e3B8221a8bf351C2892Bae89Aef4
```

## Usage Examples

### 1. Swap Functionality
```typescript
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
```

### 2. Oracle Price Feeds
```typescript
import { SHAH_CONTRACTS, SHAH_PAIRS } from '@/config/shah-constants';

// Get SHAH/ETH price
const shahEthPair = SHAH_PAIRS["SHAH-ETH"];
const price = await oracle.consult(shahEthPair, ethers.parseEther("1"));
```

### 3. Staking Integration
```typescript
import { SHAH_CONTRACTS } from '@/config/shah-constants';

// Stake SHAH tokens
const stakeAmount = ethers.parseEther("1000");
const stakeTx = await staking.stake(stakeAmount);

// Claim rewards
const claimTx = await staking.claimRewards();
```

### 4. AutoClaim Integration
```typescript
import { SHAH_CONTRACTS } from '@/config/shah-constants';

// Execute auto-claim
const autoClaimTx = await autoClaim.executeAutoClaim(userAddress);
```

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
- Router V2: https://etherscan.io/address/0x3f21A2c05FB60CB4feE11435BcE32d272A8cd06C
- Oracle: https://etherscan.io/address/0x3712f346f2538E2101D38F23db1B7aC382eAD30D
- Factory: https://etherscan.io/address/0x6943c5d80d4FBc2fC351E40C8f469C3B0E98a204
