# Supabase Integration for SHAH Wallet

This document outlines the complete Supabase integration setup for the SHAH Wallet project, including frontend and backend configurations.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Environment Variables
Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yiyddfxfpgrnpfcluswj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ZZJPjdgHfyqpUJy_zPANpg_b7H4p80h
SUPABASE_SERVICE_ROLE_KEY=sb_secret_Ye3sXQkytVKnjAS0Qfrb7Q_pLYS-Ax_

# Other required variables (see env.example for complete list)
WALLETCONNECT_PROJECT_ID=c3a53d6cc4381d7bde9cd287d5dc1773
NEXT_PUBLIC_RPC_MAINNET=https://ethereum-rpc.publicnode.com
NEXT_PUBLIC_RPC_POLYGON=https://polygon-rpc.publicnode.com
NEXT_PUBLIC_RPC_BSC=https://bsc-rpc.publicnode.com
NEXT_PUBLIC_RPC_ARBITRUM=https://arbitrum-rpc.publicnode.com
```

## 📁 File Structure

```
src/
├── lib/
│   ├── supabaseClient.ts      # Frontend client (browser-safe)
│   ├── supabaseAdmin.ts       # Backend client (server-side)
│   ├── supabaseUtils.ts       # Frontend utility functions
│   └── supabaseAdminUtils.ts  # Backend utility functions
├── app/
│   └── api/
│       └── supabase-test/
│           └── route.ts       # Test API endpoint
└── components/
    └── SupabaseTest.tsx       # Test component
```

## 🔧 Configuration

### Frontend Client (`src/lib/supabaseClient.ts`)
- Uses anonymous key for browser-safe operations
- Configured with auto-refresh and session persistence
- Includes TypeScript interfaces for type safety

### Backend Client (`src/lib/supabaseAdmin.ts`)
- Uses service role key for secure server operations
- Bypasses Row Level Security (RLS) for admin operations
- Configured without session persistence for server-side usage

## 📊 Database Schema

The integration expects these tables in your Supabase database:

### `wallets` table
```sql
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  address TEXT NOT NULL,
  chain_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `user_profiles` table
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  telegram_id TEXT,
  preferences JSONB DEFAULT '{"notifications_enabled": true, "default_chain": 1, "theme": "dark"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `staking_logs` table
```sql
CREATE TABLE staking_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  token_address TEXT,
  action TEXT CHECK (action IN ('stake', 'unstake', 'claim')),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `portfolio_snapshots` table
```sql
CREATE TABLE portfolio_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  portfolio_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `user_actions` table
```sql
CREATE TABLE user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `system_events` table
```sql
CREATE TABLE system_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `transactions` table
```sql
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  chain_id INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🛠️ Usage Examples

### Frontend Usage

```typescript
import { saveWalletAddress, getUserProfile, logUserAction } from '@/lib/supabaseUtils'

// Save wallet address
const wallet = await saveWalletAddress('user123', '0x1234...', 1)

// Get user profile
const profile = await getUserProfile('0x1234...')

// Log user action
await logUserAction('user123', 'wallet_connected', { address: '0x1234...' })
```

### Backend Usage (API Routes)

```typescript
import { logStaking, logSystemEvent } from '@/lib/supabaseAdminUtils'

// Log staking activity
await logStaking('user123', 100, '0xSHAH...', '0xtxhash...')

// Log system event
await logSystemEvent('api_call', { endpoint: '/api/stake' })
```

### API Endpoint Example

```typescript
// POST /api/supabase-test
{
  "action": "create_profile",
  "walletAddress": "0x1234...",
  "userId": "user123",
  "amount": 100
}
```

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:3000/api/supabase-test
```

### 2. Test Frontend Operations
- Navigate to the main page
- Find the "Supabase Integration Test" section
- Enter a user ID and wallet address
- Click "Test Frontend" to test client-side operations

### 3. Test Backend API
- Use the same test component
- Click "Test Backend API" to test server-side operations

## 🔒 Security Considerations

### Frontend (supabaseClient.ts)
- Uses anonymous key only
- Respects Row Level Security (RLS)
- Safe for browser exposure
- Limited to user's own data

### Backend (supabaseAdmin.ts)
- Uses service role key
- Bypasses RLS for admin operations
- Never expose in frontend code
- Use only in API routes and server actions

## 📈 Monitoring & Analytics

The integration includes comprehensive logging:

- **User Actions**: Track user interactions
- **System Events**: Monitor application events
- **Transaction Logs**: Record blockchain transactions
- **Portfolio Snapshots**: Track portfolio changes over time

## 🚨 Error Handling

All functions include proper error handling:

```typescript
try {
  const result = await saveWalletAddress(userId, address)
  // Success
} catch (error) {
  console.error('Supabase error:', error)
  // Handle error appropriately
}
```

## 🔄 Migration Guide

If you're upgrading from a previous version:

1. **Update environment variables** with new Supabase credentials
2. **Run database migrations** to create new tables
3. **Update imports** to use new utility functions
4. **Test all functionality** using the provided test components

## 📞 Support

For issues with the Supabase integration:

1. Check the test component for basic functionality
2. Verify environment variables are set correctly
3. Ensure database tables exist and have proper permissions
4. Check browser console and server logs for detailed error messages

## 🎯 Next Steps

After successful integration:

1. **Customize schemas** based on your specific needs
2. **Add Row Level Security** policies for production
3. **Implement real-time subscriptions** for live updates
4. **Add analytics dashboards** using Supabase's built-in tools
5. **Set up automated backups** and monitoring
