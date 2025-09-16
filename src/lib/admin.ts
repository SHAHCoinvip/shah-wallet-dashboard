import { readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { wagmiConfig } from '@/utils/wagmiConfig'
import { SHAHFactoryABI } from '@/abi/SHAHFactory'
import { SHAH_STAKING_ABI } from '@/abi/ShahStakingABI'
import { ShahGoldNFTABI } from '@/abi/ShahGoldNFTABI'
import { ERC20ABI } from '@/abi/ERC20'

// Contract addresses
const CONTRACTS = {
  SHAH_FACTORY: process.env.NEXT_PUBLIC_SHAH_FACTORY as `0x${string}`,
  SHAH_STAKING: '0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00' as `0x${string}`,
  SHAH_TOKEN: process.env.NEXT_PUBLIC_SHAH as `0x${string}`,
  SHAH_GOLD_NFT: '0x1234567890123456789012345678901234567890' as `0x${string}`, // Replace with actual
}

export interface AdminStats {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  tokensCreated: number
  totalStaked: string
  nftsMinted: number
  swapVolume: string
}

export interface TokenCreated {
  tokenAddress: string
  creator: string
  name: string
  symbol: string
  blockNumber: number
  timestamp: number
  transactionHash: string
}

/**
 * Fetch total staked SHAH from staking contract
 */
export async function getTotalStaked(): Promise<string> {
  try {
    const totalStaked = await readContract(wagmiConfig, {
      address: CONTRACTS.SHAH_STAKING,
      abi: SHAH_STAKING_ABI,
      functionName: 'totalStaked',
    })
    return formatUnits(totalStaked as bigint, 18)
  } catch (error) {
    console.error('Error fetching total staked:', error)
    return '0'
  }
}

/**
 * Fetch total NFTs minted
 */
export async function getTotalNftsMinted(): Promise<number> {
  try {
    const totalSupply = await readContract(wagmiConfig, {
      address: CONTRACTS.SHAH_GOLD_NFT,
      abi: ShahGoldNFTABI,
      functionName: 'totalSupply',
    })
    return Number(totalSupply)
  } catch (error) {
    console.error('Error fetching NFT total supply:', error)
    return 0
  }
}

/**
 * Fetch SHAH token total supply
 */
export async function getShahTotalSupply(): Promise<string> {
  try {
    const totalSupply = await readContract(wagmiConfig, {
      address: CONTRACTS.SHAH_TOKEN,
      abi: ERC20ABI,
      functionName: 'totalSupply',
    })
    return formatUnits(totalSupply as bigint, 18)
  } catch (error) {
    console.error('Error fetching SHAH total supply:', error)
    return '0'
  }
}

/**
 * Get recent token creations from events
 * Note: In production, this should use event logs or a subgraph
 */
export async function getRecentTokenCreations(limit: number = 20): Promise<TokenCreated[]> {
  // This is a mock implementation
  // In production, you would:
  // 1. Query TokenCreated events from the factory contract
  // 2. Use a subgraph like The Graph
  // 3. Use a backend service with cached event data
  
  const mockTokens: TokenCreated[] = [
    {
      tokenAddress: '0x1234567890123456789012345678901234567890',
      creator: '0x0987654321098765432109876543210987654321',
      name: 'Example Token',
      symbol: 'EXAMPLE',
      blockNumber: 18500000,
      timestamp: Date.now() - 86400000, // 1 day ago
      transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    {
      tokenAddress: '0x2345678901234567890123456789012345678901',
      creator: '0x1098765432109876543210987654321098765432',
      name: 'Test Token',
      symbol: 'TEST',
      blockNumber: 18499500,
      timestamp: Date.now() - 172800000, // 2 days ago
      transactionHash: '0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a',
    },
    {
      tokenAddress: '0x3456789012345678901234567890123456789012',
      creator: '0x2109876543210987654321098765432109876543',
      name: 'Demo Token',
      symbol: 'DEMO',
      blockNumber: 18499000,
      timestamp: Date.now() - 259200000, // 3 days ago
      transactionHash: '0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    }
  ]
  
  return mockTokens.slice(0, limit)
}

/**
 * Get comprehensive admin statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Fetch real contract data
    const [totalStaked, nftsMinted, shahSupply, recentTokens] = await Promise.all([
      getTotalStaked(),
      getTotalNftsMinted(),
      getShahTotalSupply(),
      getRecentTokenCreations(50)
    ])

    // Mock user data (in production, this would come from Supabase or analytics)
    const userStats = {
      totalUsers: 1247,
      activeUsers: 89,
      premiumUsers: 23,
    }

    return {
      ...userStats,
      tokensCreated: recentTokens.length,
      totalStaked,
      nftsMinted,
      swapVolume: '45.67', // Mock swap volume (would come from DEX analytics)
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    
    // Return fallback data
    return {
      totalUsers: 0,
      activeUsers: 0,
      premiumUsers: 0,
      tokensCreated: 0,
      totalStaked: '0',
      nftsMinted: 0,
      swapVolume: '0',
    }
  }
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return n.toString()
}

/**
 * Format token amounts
 */
export function formatTokenAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount)
  if (num === 0) return '0'
  if (num < 0.001) return '<0.001'
  if (num < 1) return num.toFixed(6)
  return formatNumber(num)
}

/**
 * Get transaction count for address (mock implementation)
 */
export async function getTransactionCount(address: string): Promise<number> {
  // Mock implementation - in production, use Etherscan API or node RPC
  return Math.floor(Math.random() * 1000) + 100
}

/**
 * Health check for contract connections
 */
export async function getContractHealthStatus() {
  const checks = []
  
  try {
    await readContract(wagmiConfig, {
      address: CONTRACTS.SHAH_TOKEN,
      abi: ERC20ABI,
      functionName: 'name',
    })
    checks.push({ contract: 'SHAH Token', status: 'healthy' })
  } catch {
    checks.push({ contract: 'SHAH Token', status: 'error' })
  }

  try {
    await readContract(wagmiConfig, {
      address: CONTRACTS.SHAH_STAKING,
      abi: SHAH_STAKING_ABI,
      functionName: 'totalStaked',
    })
    checks.push({ contract: 'SHAH Staking', status: 'healthy' })
  } catch {
    checks.push({ contract: 'SHAH Staking', status: 'error' })
  }

  return checks
}