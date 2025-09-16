/**
 * Build-time Environment Validator
 * Validates all required environment variables and fails fast with clear error messages
 */

interface EnvValidationRule {
  key: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'url' | 'address' | 'api_key'
  description: string
  validator?: (value: string) => boolean | string
  defaultValue?: string
}

const envValidationRules: EnvValidationRule[] = [
  // Feature flags
  {
    key: 'NEXT_PUBLIC_ENABLE_LITE_WALLET',
    required: false,
    type: 'boolean',
    description: 'Enable in-app lite wallet system',
    defaultValue: 'true'
  },
  {
    key: 'NEXT_PUBLIC_MAX_LITE_WALLETS',
    required: false,
    type: 'number',
    description: 'Maximum number of in-app wallets',
    defaultValue: '3'
  },
  {
    key: 'NEXT_PUBLIC_MAX_EXTERNAL_WALLETS',
    required: false,
    type: 'number',
    description: 'Maximum number of external wallets to remember',
    defaultValue: '2'
  },

  // URLs
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: true,
    type: 'url',
    description: 'Main app URL'
  },
  {
    key: 'NEXT_PUBLIC_MINIAPP_URL',
    required: false,
    type: 'url',
    description: 'Telegram mini-app URL'
  },

  // Contract Addresses (Ethereum Mainnet)
  {
    key: 'NEXT_PUBLIC_SHAH',
    required: true,
    type: 'address',
    description: 'SHAH token contract address'
  },
  {
    key: 'NEXT_PUBLIC_SHAHSWAP_ROUTER',
    required: true,
    type: 'address',
    description: 'ShahSwap router contract address'
  },
  {
    key: 'NEXT_PUBLIC_STAKING',
    required: true,
    type: 'address',
    description: 'Staking contract address'
  },
  {
    key: 'NEXT_PUBLIC_FACTORY',
    required: true,
    type: 'address',
    description: 'Token factory contract address'
  },
  {
    key: 'NEXT_PUBLIC_REGISTRY',
    required: true,
    type: 'address',
    description: 'Token registry contract address'
  },
  {
    key: 'NEXT_PUBLIC_PRICE_ORACLE',
    required: true,
    type: 'address',
    description: 'Price oracle contract address'
  },
  {
    key: 'NEXT_PUBLIC_SHAH_DECIMALS',
    required: false,
    type: 'number',
    description: 'SHAH token decimals',
    defaultValue: '18'
  },

  // Networks
  {
    key: 'NEXT_PUBLIC_RPC_MAINNET',
    required: true,
    type: 'url',
    description: 'Ethereum mainnet RPC URL'
  },
  {
    key: 'NEXT_PUBLIC_RPC_POLYGON',
    required: false,
    type: 'url',
    description: 'Polygon RPC URL'
  },
  {
    key: 'NEXT_PUBLIC_RPC_BSC',
    required: false,
    type: 'url',
    description: 'BSC RPC URL'
  },
  {
    key: 'NEXT_PUBLIC_RPC_ARBITRUM',
    required: false,
    type: 'url',
    description: 'Arbitrum RPC URL'
  },

  // Supabase
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    type: 'url',
    description: 'Supabase project URL'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    type: 'api_key',
    description: 'Supabase anonymous key'
  },
  {
    key: 'SUPABASE_SERVICE_ROLE',
    required: true,
    type: 'api_key',
    description: 'Supabase service role key'
  },

  // Stripe
  {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    type: 'api_key',
    description: 'Stripe secret key'
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    type: 'api_key',
    description: 'Stripe webhook secret'
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    type: 'api_key',
    description: 'Stripe publishable key'
  },

  // Telegram
  {
    key: 'TELEGRAM_BOT_TOKEN',
    required: true,
    type: 'api_key',
    description: 'Telegram bot token'
  },
  {
    key: 'TELEGRAM_BOT_USERNAME',
    required: true,
    type: 'string',
    description: 'Telegram bot username'
  },
  {
    key: 'TELEGRAM_WEBAPP_SECRET',
    required: false,
    type: 'api_key',
    description: 'Telegram WebApp secret'
  },

  // Price Providers
  {
    key: 'PRICE_PROVIDER',
    required: false,
    type: 'string',
    description: 'Price provider (geckoterminal|coingecko|cryptocompare)',
    defaultValue: 'geckoterminal',
    validator: (value) => ['geckoterminal', 'coingecko', 'cryptocompare'].includes(value) || 
      'Must be one of: geckoterminal, coingecko, cryptocompare'
  },
  {
    key: 'GECKOTERMINAL_API_KEY',
    required: false,
    type: 'api_key',
    description: 'GeckoTerminal API key'
  },
  {
    key: 'COINGECKO_API_KEY',
    required: false,
    type: 'api_key',
    description: 'CoinGecko API key'
  },
  {
    key: 'CRYPTOCOMPARE_API_KEY',
    required: false,
    type: 'api_key',
    description: 'CryptoCompare API key'
  },

  // Balancer Integration
  {
    key: 'BALANCER_SUBGRAPH',
    required: false,
    type: 'url',
    description: 'Balancer subgraph URL',
    defaultValue: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
  },
  {
    key: 'NEXT_PUBLIC_BALANCER_SUBGRAPH',
    required: false,
    type: 'url',
    description: 'Public Balancer subgraph URL',
    defaultValue: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
  },
  {
    key: 'NEXT_PUBLIC_BALANCER_VAULT',
    required: false,
    type: 'address',
    description: 'Balancer V2 Vault contract address',
    defaultValue: '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
  },

  // Auto-Claim
  {
    key: 'AUTOCLAIM_EXECUTOR_ADDRESS',
    required: false,
    type: 'address',
    description: 'Auto-claim executor contract address',
    defaultValue: '0x0000000000000000000000000000000000000000'
  },

  // Gas Optimization
  {
    key: 'NEXT_PUBLIC_GAS_ORACLE_URL',
    required: false,
    type: 'url',
    description: 'Gas oracle URL',
    defaultValue: 'https://api.blocknative.com/gasprices/blockprices'
  },

  // Legacy/Backward Compatibility
  {
    key: 'RPC_URL',
    required: false,
    type: 'url',
    description: 'Legacy RPC URL (use NEXT_PUBLIC_RPC_MAINNET instead)'
  },
  {
    key: 'NEXT_PUBLIC_RPC_URL',
    required: false,
    type: 'url',
    description: 'Legacy public RPC URL (use NEXT_PUBLIC_RPC_MAINNET instead)'
  },
  {
    key: 'WALLETCONNECT_PROJECT_ID',
    required: false,
    type: 'api_key',
    description: 'WalletConnect project ID'
  },
  {
    key: 'ETHERSCAN_KEY',
    required: false,
    type: 'api_key',
    description: 'Etherscan API key'
  }
]

// Validation functions
const validators = {
  string: (value: string) => typeof value === 'string' && value.length > 0,
  number: (value: string) => !isNaN(Number(value)) && value.length > 0,
  boolean: (value: string) => ['true', 'false', '1', '0'].includes(value.toLowerCase()),
  url: (value: string) => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  address: (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value),
  api_key: (value: string) => value.length > 0 && value !== 'xxxxxxxxxxxxxxxxxxxxxxxx'
}

async function validateEnvironment(): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if .env.local exists
  const fs = await import('fs')
  const path = await import('path')
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    errors.push(`❌ .env.local file not found at ${envPath}`)
    errors.push(`💡 Please copy env.example to .env.local and fill in your values`)
    return {
      isValid: false,
      errors,
      warnings
    }
  }

  for (const rule of envValidationRules) {
    const value = process.env[rule.key]
    
    // Handle required variables
    if (rule.required && !value) {
      errors.push(`❌ Missing required environment variable: ${rule.key} (${rule.description})`)
      continue
    }

    // Handle optional variables with defaults
    if (!value && rule.defaultValue) {
      warnings.push(`⚠️  Using default value for ${rule.key}: ${rule.defaultValue}`)
      continue
    }

    // Skip validation for missing optional variables
    if (!value) {
      continue
    }

    // Type validation
    const typeValidator = validators[rule.type]
    if (!typeValidator(value)) {
      errors.push(`❌ Invalid ${rule.type} format for ${rule.key}: "${value}" (${rule.description})`)
      continue
    }

    // Custom validator
    if (rule.validator) {
      const customResult = rule.validator(value)
      if (customResult !== true) {
        errors.push(`❌ Validation failed for ${rule.key}: ${customResult}`)
      }
    }

    // Specific validations
    if (rule.key === 'PRICE_PROVIDER' && value) {
      const provider = value.toLowerCase()
      if (provider === 'geckoterminal' && !process.env.GECKOTERMINAL_API_KEY) {
        warnings.push(`⚠️  GeckoTerminal selected but GECKOTERMINAL_API_KEY not set`)
      }
      if (provider === 'coingecko' && !process.env.COINGECKO_API_KEY) {
        warnings.push(`⚠️  CoinGecko selected but COINGECKO_API_KEY not set`)
      }
      if (provider === 'cryptocompare' && !process.env.CRYPTOCOMPARE_API_KEY) {
        warnings.push(`⚠️  CryptoCompare selected but CRYPTOCOMPARE_API_KEY not set`)
      }
    }

    // Check for placeholder values
    if (value.includes('xxxxxxxxxxxxxxxxxxxxxxxx') || value.includes('0x0000000000000000000000000000000000000000')) {
      warnings.push(`⚠️  ${rule.key} appears to be a placeholder value`)
    }
  }

  // Check for legacy variables
  if (process.env.RPC_URL && !process.env.NEXT_PUBLIC_RPC_MAINNET) {
    warnings.push(`⚠️  Using legacy RPC_URL, consider migrating to NEXT_PUBLIC_RPC_MAINNET`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Main validation function
export async function validateEnv(): Promise<void> {
  console.log('🔍 Validating environment variables...')
  
  const result = await validateEnvironment()
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach((warning: string) => console.log(warning))
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ Environment validation failed:')
    result.errors.forEach((error: string) => console.log(error))
    console.log('\n💡 Please check your .env.local file and ensure all required variables are set.')
    console.log('📖 See env.example for the complete list of required variables.')
    console.log('\n📝 Quick setup:')
    console.log('1. Copy env.example to .env.local')
    console.log('2. Fill in your actual values (replace placeholders)')
    console.log('3. Run this validation again')
    process.exit(1)
  }
  
  console.log('✅ Environment validation passed!')
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} warning(s) found. Review and fix if needed.`)
  }
}

// Export for use in other modules
export { envValidationRules, validators } 