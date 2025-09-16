# ShahSwap Upgrades Documentation

## Overview

This document describes the major upgrades implemented for ShahSwap, including TWAP Oracle, Advanced Routing, and Gas Optimizations.

## 🚀 New Features

### 1. TWAP Oracle (Time-Weighted Average Price)

**Purpose**: Provides manipulation-resistant price feeds for SHAH and other tokens.

**Key Components**:
- `OracleLibrary.sol`: Core TWAP calculation logic
- `ShahSwapOracle.sol`: Main oracle contract
- `IOracle.sol`: Interface for oracle interactions

**Features**:
- 30-minute to 24-hour TWAP periods
- Cumulative price tracking
- Spot price calculations
- Price impact analysis
- Minimum liquidity requirements

**Usage**:
```solidity
// Get TWAP price
(uint256 amountOut, uint256 priceTWAP) = oracle.consult(
    tokenIn,
    tokenOut,
    amountIn,
    1800 // 30 minutes
);

// Get spot price
(uint256 amountOut, uint256 priceSpot) = oracle.getSpotPrice(
    tokenIn,
    tokenOut,
    amountIn
);

// Get price impact
uint256 priceImpact = oracle.getPriceImpact(
    tokenIn,
    tokenOut,
    amountIn
);
```

### 2. Advanced Routing

**Purpose**: Enable multi-hop swaps and optimized routing for better execution.

**Key Components**:
- `ShahSwapRouterV2.sol`: Enhanced router with advanced features
- Multi-hop swap support
- Batch swap functionality
- Split routing capabilities

**Features**:
- Multi-hop swaps with path optimization
- Batch swaps for multiple tokens
- Best route calculation
- Gas optimization

**Usage**:
```solidity
// Multi-hop swap
uint256[] memory amounts = router.swapExactTokensForTokensMultiHop({
    amountIn: 1000e18,
    amountOutMin: 950e18,
    path: [SHAH, WETH, USDC],
    to: user,
    deadline: block.timestamp + 1200
});

// Batch swap
uint256 totalAmountOut = router.batchSwapExactTokensForTokens({
    swaps: [swap1, swap2, swap3],
    totalAmountIn: 3000e18,
    totalAmountOutMin: 2850e18,
    to: user,
    deadline: block.timestamp + 1200
});
```

### 3. Gas Optimizations

**Purpose**: Reduce gas costs and improve user experience through permit support and batching.

**Key Components**:
- EIP-2612 permit() support
- Batch transaction processing
- Gas refund optimization

**Features**:
- Gasless approvals via permit()
- Batch swaps in single transaction
- Optimized storage usage
- Precomputed gas estimates

**Usage**:
```solidity
// Permit swap (gasless approval)
uint256[] memory amounts = router.swapExactTokensForTokensWithPermit({
    swap: {
        amountIn: 1000e18,
        amountOutMin: 950e18,
        path: [SHAH, WETH],
        to: user,
        deadline: block.timestamp + 1200
    },
    deadline: block.timestamp + 1200,
    v: v,
    r: r,
    s: s
});
```

### 4. SHAH Token (v1)

**Purpose**: The official SHAH token with existing functionality.

**Key Components**:
- **Address**: `0x6E0cFA42F797E316ff147A21f7F1189cd610ede8`
- **Status**: Official token, no upgrade needed

**Note**: ShahTokenV2.sol was scaffolded but is not deployed or used. SHAH v1 remains the official token.

## 📋 Contract Addresses

### Mainnet Deployment

| Contract | Address | Description |
|----------|---------|-------------|
| ShahSwapOracle | `0x...` | TWAP Oracle |
| ShahSwapRouterV2 | `0x...` | Enhanced Router |
| SHAH Token (v1) | `0x6E0cFA42F797E316ff147A21f7F1189cd610ede8` | Official SHAH Token |
| OracleLibrary | `0x...` | Oracle Library |

### Environment Variables

```env
# ShahSwap Upgrades
NEXT_PUBLIC_SHAHSWAP_ORACLE=0x...
NEXT_PUBLIC_SHAHSWAP_ROUTER=0x...
NEXT_PUBLIC_ENABLE_TWAP=true
NEXT_PUBLIC_ENABLE_PERMIT=true
NEXT_PUBLIC_ENABLE_BATCH_SWAPS=true
```

## 🔧 Deployment

### Prerequisites

1. Hardhat environment configured
2. Environment variables set
3. Sufficient ETH for deployment

### Deployment Steps

```bash
# 1. Compile contracts
npx hardhat compile

# 2. Deploy upgrades
npx hardhat run scripts/deployShahSwapUpgrades.cjs --network mainnet

# 3. Verify contracts
npx hardhat verify --network mainnet 0x... # Oracle
npx hardhat verify --network mainnet 0x... # Router
```

### Post-Deployment Setup

1. **Configure Oracle**:
   ```solidity
   // Add SHAH-ETH pair to oracle
   oracle.addPair(shahEthPair, SHAH_TOKEN, WETH);
   ```

2. **Configure Router**:
   ```solidity
   // Set oracle in router
   router.setOracle(oracleAddress);
   ```

3. **Update Frontend**:
   - Update contract addresses
   - Enable new features
   - Test functionality

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "TWAP"
npm test -- --grep "Routing"
npm test -- --grep "Permit"
```

### Integration Tests

```bash
# Test on local network
npx hardhat test test/integration/shahswap-upgrades.test.js

# Test on fork
npx hardhat test test/integration/shahswap-upgrades.test.js --network mainnet-fork
```

### Manual Testing

1. **TWAP Oracle**:
   - Deploy oracle
   - Add pairs
   - Test price queries
   - Verify manipulation resistance

2. **Advanced Routing**:
   - Test multi-hop swaps
   - Test batch swaps
   - Verify gas savings
   - Check route optimization

3. **Permit Support**:
   - Test gasless approvals
   - Verify signature validation
   - Test deadline enforcement
   - Check nonce management

## 📊 Monitoring

### Events to Monitor

```solidity
// Oracle Events
event OracleUpdated(address indexed pair, uint256 price0Cumulative, uint256 price1Cumulative, uint32 timestamp);
event PairAdded(address indexed pair, address indexed token0, address indexed token1);

// Router Events
event SwapExecuted(address indexed user, address[] path, uint256 amountIn, uint256 amountOut, uint256 gasUsed);
event BatchSwapExecuted(address indexed user, uint256 totalAmountIn, uint256 totalAmountOut, uint256 swapsCount, uint256 gasUsed);
event PermitSwapExecuted(address indexed user, address[] path, uint256 amountIn, uint256 amountOut, uint256 deadline);

// Token Events
event PermitUsed(address indexed owner, address indexed spender, uint256 value, uint256 deadline);
event TransferFeeUpdated(uint256 oldFee, uint256 newFee);
```

### Key Metrics

- **TWAP Accuracy**: Compare TWAP vs spot prices
- **Gas Savings**: Measure gas reduction from permit and batching
- **Routing Efficiency**: Track best route selection
- **User Adoption**: Monitor feature usage

## 🔒 Security Considerations

### Oracle Security

1. **Manipulation Resistance**:
   - Minimum TWAP period (30 minutes)
   - Maximum TWAP period (24 hours)
   - Cumulative price tracking
   - Liquidity requirements

2. **Access Control**:
   - Owner-only pair management
   - Emergency pause functionality
   - Fee recipient controls

### Router Security

1. **Reentrancy Protection**:
   - NonReentrant modifiers
   - Checks-effects-interactions pattern
   - Safe external calls

2. **Input Validation**:
   - Path validation
   - Deadline checks
   - Amount validation
   - Address validation

### Token Security

1. **Permit Security**:
   - EIP-712 domain validation
   - Signature verification
   - Nonce management
   - Deadline enforcement

2. **Governance Security**:
   - Voting power delegation
   - Snapshot integration
   - Proposal validation

## 🚨 Emergency Procedures

### Oracle Emergency

```solidity
// Pause oracle updates
oracle.emergencyPause("Security concern");

// Remove problematic pair
oracle.removePair(pairAddress);

// Recover stuck tokens
oracle.emergencyRecover(token, amount);
```

### Router Emergency

```solidity
// Pause all swaps
router.emergencyPause("Security concern");

// Recover stuck tokens
router.emergencyRecover(token, amount);

// Recover ETH
router.emergencyRecoverETH();
```

### Token Emergency

```solidity
// Pause all transfers
shahToken.emergencyPause("Security concern");

// Recover stuck tokens
shahToken.emergencyRecover(token, amount);
```

## 📈 Performance Optimization

### Gas Optimization

1. **Batch Operations**:
   - Combine multiple swaps
   - Reduce transaction overhead
   - Optimize storage usage

2. **Permit Usage**:
   - Skip approval transactions
   - Reduce gas costs
   - Improve UX

3. **Route Optimization**:
   - Find best execution path
   - Minimize price impact
   - Reduce slippage

### Oracle Optimization

1. **Caching**:
   - Cache cumulative prices
   - Reduce on-chain calls
   - Optimize storage

2. **Batching**:
   - Batch price updates
   - Reduce gas costs
   - Improve efficiency

## 🔄 Migration Guide

### From V1 to V2

1. **Router Migration**:
   ```solidity
   // Old router
   address oldRouter = 0x40677E55C83C032e595f0CE25035636DFD6bc03d;
   
   // New router
   address newRouter = 0x...; // Deployed V2 address
   ```

2. **Oracle Integration**:
   ```solidity
   // Set oracle in router
   routerV2.setOracle(oracleAddress);
   
   // Add pairs to oracle
   oracle.addPair(pairAddress, token0, token1);
   ```

3. **Token Usage**:
   ```solidity
   // Use existing SHAH token
   address shahToken = 0x6E0cFA42F797E316ff147A21f7F1189cd610ede8;
   
   // No migration needed - SHAH v1 remains official
   ```

### Frontend Migration

1. **Update Contract Addresses**:
   ```typescript
   const SHAHSWAP_ROUTER = process.env.NEXT_PUBLIC_SHAHSWAP_ROUTER;
   const SHAHSWAP_ORACLE = process.env.NEXT_PUBLIC_SHAHSWAP_ORACLE;
   ```

2. **Enable New Features**:
   ```typescript
   const ENABLE_TWAP = process.env.NEXT_PUBLIC_ENABLE_TWAP === 'true';
   const ENABLE_PERMIT = process.env.NEXT_PUBLIC_ENABLE_PERMIT === 'true';
   ```

3. **Update UI Components**:
   - Add TWAP toggle
   - Add permit toggle
   - Show price impact
   - Display gas savings

## 📚 API Reference

### Oracle Functions

```solidity
// Get TWAP price
function consult(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint32 period
) external view returns (uint256 amountOut, uint256 priceTWAP);

// Get spot price
function getSpotPrice(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 amountOut, uint256 priceSpot);

// Get price impact
function getPriceImpact(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external view returns (uint256 priceImpact);
```

### Router Functions

```solidity
// Multi-hop swap
function swapExactTokensForTokensMultiHop(
    SwapParams calldata params
) external returns (uint256[] memory amounts);

// Batch swap
function batchSwapExactTokensForTokens(
    BatchSwapParams calldata params
) external returns (uint256 totalAmountOut);

// Permit swap
function swapExactTokensForTokensWithPermit(
    PermitSwapParams calldata params
) external returns (uint256[] memory amounts);
```

### SHAH Token (v1) Functions

```solidity
// Standard ERC-20 functions
function transfer(address to, uint256 amount) external returns (bool);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
function balanceOf(address account) external view returns (uint256);
function allowance(address owner, address spender) external view returns (uint256);

// Note: SHAH v1 uses standard ERC-20, permit() is handled by RouterV2
```

## 🤝 Contributing

### Development Setup

1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd shah-wallet-dashboard
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp env.example .env.local
   # Fill in required values
   ```

4. **Compile Contracts**:
   ```bash
   npx hardhat compile
   ```

### Testing

1. **Unit Tests**:
   ```bash
   npm test
   ```

2. **Integration Tests**:
   ```bash
   npm run test:integration
   ```

3. **Gas Tests**:
   ```bash
   npm run test:gas
   ```

### Code Quality

1. **Linting**:
   ```bash
   npm run lint
   ```

2. **Formatting**:
   ```bash
   npm run format
   ```

3. **Type Checking**:
   ```bash
   npm run type-check
   ```

## 📞 Support

### Documentation

- [Contract Documentation](./contracts/)
- [API Reference](./api/)
- [Integration Guide](./integration/)

### Community

- [Discord](https://discord.gg/shah)
- [Telegram](https://t.me/shahcoin)
- [GitHub Issues](https://github.com/shah/shah-wallet-dashboard/issues)

### Security

- [Security Policy](./SECURITY.md)
- [Bug Bounty Program](./bounty.md)
- [Audit Reports](./audits/)

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Maintainer**: SHAH Wallet Team
