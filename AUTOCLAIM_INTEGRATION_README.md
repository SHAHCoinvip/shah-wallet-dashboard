# Auto-Claim Integration for SHAH Wallet

This document outlines the complete auto-claim integration for automatic staking rewards claiming with a small execution fee.

## 🚀 Overview

The auto-claim system allows users to automatically claim their staking rewards every hour with a small fee (0.1 SHAH) that goes to the treasury. This reduces gas costs for users and provides a revenue stream for the protocol.

## 📁 File Structure

```
contracts/
├── AutoClaimExecutor.sol          # Smart contract for auto-claiming
scripts/
├── deployAutoClaim.cjs            # Deployment script
src/
├── app/
│   └── api/
│       └── cron/
│           └── auto-claim/
│               └── route.ts       # Vercel cron job API
├── app/
│   └── staking/
│       └── page.tsx               # Updated with auto-claim toggle
supabase-auto-claim-migration.sql  # Database migration
```

## 🔧 Smart Contract: AutoClaimExecutor.sol

### Features
- **Batch Processing**: Claims rewards for multiple users in a single transaction
- **Fee System**: Charges 0.1 SHAH per claim (configurable)
- **Safety**: Includes pause/unpause functionality and emergency withdraw
- **Events**: Comprehensive event logging for transparency
- **Ownership**: Only owner can update fees and treasury

### Key Functions
```solidity
// Claim rewards for a single user
function autoClaim(address user) external returns (uint256 rewards, uint256 fee)

// Claim rewards for multiple users
function batchAutoClaim(address[] calldata users) external returns (uint256 totalRewards, uint256 totalFees)

// Update execution fee (owner only)
function updateExecutionFee(uint256 newFee) external

// Update treasury address (owner only)
function updateTreasury(address newTreasury) external
```

### Fee Logic
- **Flat Fee**: 0.1 SHAH per claim (configurable)
- **Threshold**: Only claims if rewards ≥ 0.05 SHAH
- **Example**: User has 10 SHAH rewards → gets 9.9 SHAH, treasury gets 0.1 SHAH

## 🚀 Deployment

### 1. Deploy the Contract
```bash
npx hardhat run scripts/deployAutoClaim.cjs --network mainnet
```

### 2. Update Environment Variables
The deployment script will automatically update your `.env.local`:
```env
AUTOCLAIM_EXECUTOR_ADDRESS=0xDeployedContractHere
NEXT_PUBLIC_ENABLE_STAKING_AUTOCLAIM=true
TREASURY_ADDRESS=0xYourTreasuryAddress
CRON_SECRET=your-secure-cron-secret
```

### 3. Verify on Etherscan
The deployment script includes automatic verification.

## 📊 Database Setup

### Run the Migration
Execute `supabase-auto-claim-migration.sql` in your Supabase SQL editor.

### Tables Created
- **`auto_claim_jobs`**: User auto-claim preferences
- **`auto_claim_executions`**: Execution logs and results
- **`auto_claim_settings`**: Global settings and configuration

### Key Functions
```sql
-- Enable auto-claim for a user
SELECT enable_auto_claim('0xuser_address');

-- Disable auto-claim for a user
SELECT disable_auto_claim('0xuser_address');

-- Get eligible users for auto-claim
SELECT * FROM get_eligible_users_for_auto_claim(50, 1);

-- Log execution results
SELECT log_auto_claim_execution(...);
```

## ⏰ Cron Job Setup

### Vercel Cron Configuration
Add to your `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-claim",
      "schedule": "0 * * * *"
    }
  ]
}
```

### API Endpoint
- **GET**: `/api/cron/auto-claim` - Executes auto-claim for eligible users
- **POST**: `/api/cron/auto-claim` - Manual trigger (with `testMode: true` for testing)

### Security
- Requires `Authorization: Bearer {CRON_SECRET}` header
- Only processes users with `status = 'enabled'`
- Includes comprehensive error handling and logging

## 🎨 UI Integration

### Staking Page Updates
The staking page now includes:
- **Auto-Claim Toggle**: Enable/disable automatic claiming
- **Status Badge**: Shows "Active ✅" when enabled
- **Tooltip**: Explains fee structure and timing
- **Real-time Updates**: Status updates immediately

### User Experience
1. User connects wallet
2. Toggles "Enable Auto-Claim"
3. System creates/updates record in Supabase
4. Cron job processes claims every hour
5. User sees status updates and transaction history

## 🧪 Testing

### 1. Contract Testing
```bash
npx hardhat test
```

### 2. Manual API Testing
```bash
# Test mode (no actual transactions)
curl -X POST http://localhost:3000/api/cron/auto-claim \
  -H "Content-Type: application/json" \
  -d '{"testMode": true}'

# Real execution (requires CRON_SECRET)
curl -X GET http://localhost:3000/api/cron/auto-claim \
  -H "Authorization: Bearer your-cron-secret"
```

### 3. UI Testing
1. Connect wallet on staking page
2. Toggle auto-claim on/off
3. Verify Supabase records are created/updated
4. Check status badge updates

## 📈 Monitoring & Analytics

### Supabase Dashboard
- **Auto-claim Jobs**: Track user preferences
- **Execution Logs**: Monitor success/failure rates
- **Statistics**: Total rewards claimed, fees collected

### System Events
All auto-claim activities are logged in `system_events`:
- `auto_claim_success`: Successful batch executions
- `auto_claim_error`: Failed executions
- `auto_claim_test`: Test mode executions

### Key Metrics
- Total users with auto-claim enabled
- Total rewards claimed automatically
- Total fees collected
- Success/failure rates
- Gas costs and efficiency

## 🔒 Security Considerations

### Smart Contract
- **Ownership**: Only owner can update critical parameters
- **Pausable**: Can be paused in emergency
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Input Validation**: Validates all inputs

### API Security
- **Authentication**: Requires cron secret
- **Rate Limiting**: Built into Vercel
- **Error Handling**: Comprehensive error logging
- **Input Sanitization**: Validates all inputs

### Database Security
- **Row Level Security**: Users can only access their own data
- **Admin Functions**: Protected admin-only functions
- **Audit Trail**: Complete execution logging

## 🚨 Troubleshooting

### Common Issues

1. **Contract Not Deployed**
   - Check `AUTOCLAIM_EXECUTOR_ADDRESS` in `.env.local`
   - Verify contract on Etherscan

2. **Cron Job Not Running**
   - Check Vercel cron configuration
   - Verify `CRON_SECRET` is set correctly
   - Check Vercel function logs

3. **Database Errors**
   - Ensure migration is run in Supabase
   - Check RLS policies are correct
   - Verify function permissions

4. **UI Not Updating**
   - Check Supabase connection
   - Verify auto-claim tables exist
   - Check browser console for errors

### Debug Commands
```bash
# Check contract deployment
npx hardhat run scripts/deployAutoClaim.cjs --network mainnet

# Test database connection
curl -X POST http://localhost:3000/api/supabase-test

# Check cron job manually
curl -X POST http://localhost:3000/api/cron/auto-claim -d '{"testMode": true}'
```

## 📋 Deployment Checklist

- [ ] Deploy AutoClaimExecutor contract
- [ ] Verify contract on Etherscan
- [ ] Update environment variables
- [ ] Run Supabase migration
- [ ] Configure Vercel cron job
- [ ] Test auto-claim functionality
- [ ] Monitor initial executions
- [ ] Update documentation

## 🎯 Next Steps

1. **Production Deployment**
   - Deploy to mainnet
   - Set up monitoring alerts
   - Configure treasury wallet

2. **Advanced Features**
   - Dynamic fee adjustment based on gas prices
   - User-defined claim thresholds
   - Batch size optimization
   - Multi-chain support

3. **Analytics Dashboard**
   - Real-time auto-claim statistics
   - User engagement metrics
   - Revenue tracking
   - Performance optimization

## 📞 Support

For issues with the auto-claim integration:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Check Supabase database logs
4. Verify contract events on Etherscan
5. Test with the provided debug commands

---

**Auto-Claim Integration Complete! 🎉**

Your SHAH Wallet now supports automatic staking rewards claiming with a small execution fee, providing users with convenience while generating protocol revenue.
