# Oracle Pair Addition Guide

## 🎯 ShahSwap Oracle: `0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52`

### **Current Status:**
- ✅ Oracle deployed and verified
- ✅ Router V2 configured with Oracle
- ⏳ Pairs need to be added to Oracle

### **How to Add Pairs to Oracle:**

#### **Method 1: Manual via Etherscan (Recommended)**

1. **Go to Oracle Contract:**
   - https://etherscan.io/address/0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52

2. **Click "Write Contract"**

3. **Call `addPair` function with:**
   - `pairAddress`: [Your pair contract address]
   - `token0`: `0x6E0cFA42F797E316ff147A21f7F1189cd610ede8` (SHAH)
   - `token1`: [Other token address]

#### **Method 2: Find Pair Addresses**

**Check your Factory Contract:**
- Factory: https://etherscan.io/address/0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a
- Look for "PairCreated" events
- Check recent transactions for pair creation

**Common Token Addresses:**
- WETH: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- USDC: `0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C`
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`

#### **Method 3: Script (When you have pair addresses)**

1. **Edit `scripts/add-specific-pairs.cjs`**
2. **Add your pair addresses:**
   ```javascript
   const PAIRS_TO_ADD = [
       { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.WETH, name: "SHAH-ETH" },
       { pairAddress: "0x...", token0: SHAH_TOKEN, token1: TOKENS.USDC, name: "SHAH-USDC" },
   ];
   ```
3. **Run the script:**
   ```bash
   npx hardhat run scripts/add-specific-pairs.cjs --network mainnet
   ```

### **What Happens After Adding Pairs:**

✅ **TWAP Price Feeds** - Oracle will provide manipulation-resistant prices  
✅ **Better Routing** - Router V2 can use TWAP prices for optimal swaps  
✅ **Gas Optimization** - Permit() support for gasless approvals  
✅ **Advanced Features** - Multi-hop swaps, batch operations  

### **Verification:**

After adding pairs, you can verify they're working by:
1. Checking the Oracle contract on Etherscan
2. Testing swaps on your frontend
3. Monitoring TWAP price feeds

### **Next Steps:**

1. **Find your pair addresses** from the factory
2. **Add them to the Oracle** using one of the methods above
3. **Test the new features** on your frontend
4. **Monitor performance** and gas usage

---

**Need Help?** Check the factory contract transactions or ask for assistance with finding pair addresses!
