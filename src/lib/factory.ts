import { parseUnits, formatUnits, decodeEventLog } from 'viem'
import { SHAHFactoryABI } from '@/abi/SHAHFactory'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'

// Contract addresses from environment
export const CONTRACTS = {
  SHAH_FACTORY: process.env.NEXT_PUBLIC_SHAH_FACTORY as `0x${string}`,
  SHAH_REGISTRY: process.env.NEXT_PUBLIC_SHAH_REGISTRY as `0x${string}`,
  SHAH_PRICE_ORACLE: process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE as `0x${string}`,
  SHAH_TOKEN: process.env.NEXT_PUBLIC_SHAH as `0x${string}`,
}

// Feature bitmap constants
export const FEATURES = {
  BASIC: 0n,
  BURNABLE: 1n << 0n,
  PAUSABLE: 1n << 1n,
  CAPPED: 1n << 2n,
  OWNABLE: 1n << 3n,
  UPGRADEABLE: 1n << 4n,
}

export interface TokenFeatures {
  basic: boolean
  burnable: boolean
  pausable: boolean
  capped: boolean
  ownable: boolean
  upgradeable: boolean
}

export interface TokenCreationArgs {
  name: string
  symbol: string
  decimals: number
  initialSupply: string
  owner: `0x${string}`
  features: bigint
  maxSupply: string
}

/**
 * Get SHAH price in USD from the oracle
 * This will be called from React components using wagmi hooks
 */
export function formatShahPrice(priceData: bigint | undefined, decimals: number = 8): number {
  if (!priceData) return 1.72 // Fallback price
  
  try {
    // Convert from oracle format (usually 8 decimals) to USD
    const price = Number(formatUnits(priceData, decimals))
    return price > 0 ? price : 1.72
  } catch (error) {
    console.error('Error formatting SHAH price:', error)
    return 1.72
  }
}

/**
 * Calculate required SHAH amount for a USD price
 */
export function calcShahForUsd(usdAmount: number, shahPriceUsd: number): string {
  if (shahPriceUsd <= 0) return parseUnits('0', 18).toString()
  
  const shahAmount = usdAmount / shahPriceUsd
  // Round up to avoid insufficient amount errors
  const roundedAmount = Math.ceil(shahAmount * 1000) / 1000
  return parseUnits(roundedAmount.toString(), 18).toString()
}

/**
 * Encode feature checkboxes into a bitmap
 */
export function getFeatureBitmap(features: TokenFeatures): bigint {
  let bitmap = 0n
  
  if (features.burnable) bitmap |= FEATURES.BURNABLE
  if (features.pausable) bitmap |= FEATURES.PAUSABLE
  if (features.capped) bitmap |= FEATURES.CAPPED
  if (features.ownable) bitmap |= FEATURES.OWNABLE
  if (features.upgradeable) bitmap |= FEATURES.UPGRADEABLE
  
  return bitmap
}

/**
 * Decode TokenCreated event from transaction logs
 */
export function decodeTokenCreated(logs: any[]): `0x${string}` | null {
  try {
    for (const log of logs) {
      if (log.address?.toLowerCase() === CONTRACTS.SHAH_FACTORY?.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: SHAHFactoryABI,
            data: log.data,
            topics: log.topics,
            eventName: 'TokenCreated'
          })
          
          if (decoded.eventName === 'TokenCreated') {
            return decoded.args.token as `0x${string}`
          }
        } catch (e) {
          // Continue to next log if this one doesn't decode
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error decoding TokenCreated event:', error)
    return null
  }
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  return formatUnits(BigInt(amount), decimals)
}

/**
 * Parse token amount from user input
 */
export function parseTokenAmount(amount: string, decimals: number = 18): string {
  return parseUnits(amount, decimals).toString()
}

/**
 * Validate token creation parameters
 */
export function validateTokenParams(params: Partial<TokenCreationArgs>): string[] {
  const errors: string[] = []
  
  if (!params.name || params.name.trim().length === 0) {
    errors.push('Token name is required')
  }
  
  if (!params.symbol || params.symbol.trim().length === 0) {
    errors.push('Token symbol is required')
  }
  
  if (params.symbol && params.symbol.length > 11) {
    errors.push('Token symbol must be 11 characters or less')
  }
  
  if (!params.decimals || params.decimals < 0 || params.decimals > 18) {
    errors.push('Decimals must be between 0 and 18')
  }
  
  if (!params.initialSupply || parseFloat(params.initialSupply) <= 0) {
    errors.push('Initial supply must be greater than 0')
  }
  
  if (!params.owner || !/^0x[a-fA-F0-9]{40}$/.test(params.owner)) {
    errors.push('Valid owner address is required')
  }
  
  return errors
}

/**
 * Generate Etherscan verification data
 */
export function generateEtherscanVerification(params: TokenCreationArgs): {
  constructorArguments: string
  compilerVersion: string
  optimizerRuns: number
} {
  // Encode constructor arguments for Etherscan verification
  // This would need to be adjusted based on the actual token contract constructor
  const constructorArgs = [
    params.name,
    params.symbol,
    params.decimals,
    params.initialSupply,
    params.owner,
    params.features.toString(),
    params.maxSupply
  ]
  
  return {
    constructorArguments: JSON.stringify(constructorArgs),
    compilerVersion: '0.8.19+commit.7dd6d404',
    optimizerRuns: 200
  }
}

/**
 * Get pricing information
 */
export const PRICING = {
  CARD_USD: 49,
  SHAH_USD: 39,
  VERIFICATION_USD: 20,
}