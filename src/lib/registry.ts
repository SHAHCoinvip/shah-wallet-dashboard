import { parseUnits, formatUnits } from 'viem'
import { readContract, writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { VerifiedTokenRegistryABI } from '@/abi/VerifiedTokenRegistry'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'
import { wagmiConfig } from '@/utils/wagmiConfig'

// Contract addresses
const VERIFIED_TOKEN_REGISTRY = process.env.NEXT_PUBLIC_SHAH_REGISTRY as `0x${string}`
const SHAH_PRICE_ORACLE = process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE as `0x${string}`
const SHAH_TOKEN = process.env.NEXT_PUBLIC_SHAH as `0x${string}`

// Verification fee in USD
export const VERIFICATION_FEE_USD = 20

/**
 * Check if a token is verified
 */
export async function isTokenVerified(tokenAddress: `0x${string}`): Promise<boolean> {
  try {
    const result = await readContract(wagmiConfig, {
      address: VERIFIED_TOKEN_REGISTRY,
      abi: VerifiedTokenRegistryABI,
      functionName: 'isVerified',
      args: [tokenAddress],
    })
    return result as boolean
  } catch (error) {
    console.error('Error checking verification status:', error)
    return false
  }
}

/**
 * Get current SHAH price from oracle
 */
export async function getShahPriceUsd(): Promise<number> {
  try {
    const priceData = await readContract(wagmiConfig, {
      address: SHAH_PRICE_ORACLE,
      abi: SHAHPriceOracleABI,
      functionName: 'getPriceInUSD',
    })
    
    // Convert from oracle format (usually 8 decimals) to USD
    const price = Number(formatUnits(priceData as bigint, 8))
    return price > 0 ? price : 1.72 // Fallback price
  } catch (error) {
    console.error('Error fetching SHAH price:', error)
    return 1.72 // Fallback price
  }
}

/**
 * Calculate required SHAH amount for USD fee
 */
export function calcShahForVerification(shahPriceUsd: number): bigint {
  if (shahPriceUsd <= 0) return parseUnits('400', 18) // Fallback: 400 SHAH
  
  const shahAmount = VERIFICATION_FEE_USD / shahPriceUsd
  // Round up to avoid insufficient amount errors
  const roundedAmount = Math.ceil(shahAmount * 1000) / 1000
  return parseUnits(roundedAmount.toString(), 18)
}

/**
 * Check SHAH allowance for verification
 */
export async function getShahAllowance(userAddress: `0x${string}`): Promise<bigint> {
  try {
    const allowance = await readContract(wagmiConfig, {
      address: SHAH_TOKEN,
      abi: ERC20ABI,
      functionName: 'allowance',
      args: [userAddress, VERIFIED_TOKEN_REGISTRY],
    })
    return allowance as bigint
  } catch (error) {
    console.error('Error checking SHAH allowance:', error)
    return 0n
  }
}

/**
 * Approve SHAH tokens for verification
 */
export async function approveShahForVerification(amount: bigint): Promise<`0x${string}`> {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: SHAH_TOKEN,
      abi: ERC20ABI,
      functionName: 'approve',
      args: [VERIFIED_TOKEN_REGISTRY, amount],
    })
    
    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, { hash })
    return hash
  } catch (error) {
    console.error('Error approving SHAH:', error)
    throw error
  }
}

/**
 * Request verification for a token
 */
export async function requestTokenVerification(
  tokenAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<`0x${string}`> {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: VERIFIED_TOKEN_REGISTRY,
      abi: VerifiedTokenRegistryABI,
      functionName: 'requestVerification',
      args: [tokenAddress],
      // Note: The actual registry contract should handle SHAH transfer internally
    })
    
    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, { hash })
    return hash
  } catch (error) {
    console.error('Error requesting verification:', error)
    throw error
  }
}

/**
 * Mark a token as verified (admin only)
 */
export async function markTokenVerified(tokenAddress: `0x${string}`): Promise<`0x${string}`> {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: VERIFIED_TOKEN_REGISTRY,
      abi: VerifiedTokenRegistryABI,
      functionName: 'markVerified',
      args: [tokenAddress],
    })
    
    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, { hash })
    return hash
  } catch (error) {
    console.error('Error marking token as verified:', error)
    throw error
  }
}

/**
 * Unverify a token (admin only)
 */
export async function unverifyToken(tokenAddress: `0x${string}`): Promise<`0x${string}`> {
  try {
    const hash = await writeContract(wagmiConfig, {
      address: VERIFIED_TOKEN_REGISTRY,
      abi: VerifiedTokenRegistryABI,
      functionName: 'unverifyToken',
      args: [tokenAddress],
    })
    
    // Wait for transaction confirmation
    await waitForTransactionReceipt(wagmiConfig, { hash })
    return hash
  } catch (error) {
    console.error('Error unverifying token:', error)
    throw error
  }
}

/**
 * Get list of recent tokens from events (for admin panel)
 * This would ideally use event logs or a subgraph
 */
export interface TokenCreatedEvent {
  tokenAddress: `0x${string}`
  owner: `0x${string}`
  name: string
  symbol: string
  blockNumber: number
  transactionHash: `0x${string}`
  timestamp: number
}

export async function getRecentTokens(limit: number = 50): Promise<TokenCreatedEvent[]> {
  // This is a placeholder - in production, you'd either:
  // 1. Use event logs from the factory contract
  // 2. Use a subgraph
  // 3. Use a cached database
  
  // For now, return mock data
  const mockTokens: TokenCreatedEvent[] = [
    {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      owner: '0x0987654321098765432109876543210987654321',
      name: 'Example Token',
      symbol: 'EXAMPLE',
      blockNumber: 18500000,
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      timestamp: Date.now() - 86400000, // 1 day ago
    }
  ]
  
  return mockTokens.slice(0, limit)
}