import { BALANCER_CONFIG, ROUTING, PoolType } from '@/config/routing'

export interface BalancerPool {
  id: string
  address: string
  poolType: PoolType
  tokens: {
    address: string
    symbol: string
    decimals: number
    weight?: number // For weighted pools
    balance: string
  }[]
  totalLiquidity: string
  swapFee: number // In basis points
  totalWeight?: number // For weighted pools
  amp?: number // For stable pools
  lastUpdate: number
}

export interface PoolCacheEntry {
  pools: BalancerPool[]
  timestamp: number
}

// In-memory cache for pool data
const poolCache = new Map<string, PoolCacheEntry>()

/**
 * Fetch pools containing a specific token from Balancer subgraph
 */
export async function fetchPoolsForToken(tokenAddress: string): Promise<BalancerPool[]> {
  const cacheKey = `pools_${tokenAddress.toLowerCase()}`
  const cached = poolCache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < ROUTING.poolCacheTtlMs) {
    return cached.pools
  }

  try {
    const query = `
      query GetPoolsForToken($tokenAddress: String!) {
        pools(
          where: { 
            tokensList_contains: [$tokenAddress],
            totalLiquidity_gt: "${ROUTING.minLiquidityUsd}"
          }
          orderBy: totalLiquidity
          orderDirection: desc
          first: ${ROUTING.maxPoolsToCheck}
        ) {
          id
          address
          poolType
          totalLiquidity
          swapFee
          totalWeight
          amp
          tokens {
            address
            symbol
            decimals
            weight
            balance
          }
          lastUpdate
        }
      }
    `

    const response = await fetch(BALANCER_CONFIG.subgraph, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { tokenAddress: tokenAddress.toLowerCase() }
      })
    })

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      throw new Error(`Subgraph errors: ${JSON.stringify(data.errors)}`)
    }

    const pools: BalancerPool[] = data.data.pools.map((pool: any) => ({
      id: pool.id,
      address: pool.address,
      poolType: pool.poolType,
      tokens: pool.tokens.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        weight: token.weight,
        balance: token.balance
      })),
      totalLiquidity: pool.totalLiquidity,
      swapFee: pool.swapFee,
      totalWeight: pool.totalWeight,
      amp: pool.amp,
      lastUpdate: parseInt(pool.lastUpdate)
    }))

    // Cache the results
    poolCache.set(cacheKey, {
      pools,
      timestamp: Date.now()
    })

    return pools

  } catch (error) {
    console.warn('Failed to fetch Balancer pools:', error)
    // Return empty array on error - this allows fallback to ShahSwap
    return []
  }
}

/**
 * Find pools that contain both input and output tokens
 */
export async function findPoolsForPair(
  tokenInAddress: string, 
  tokenOutAddress: string
): Promise<BalancerPool[]> {
  const [poolsForTokenIn, poolsForTokenOut] = await Promise.all([
    fetchPoolsForToken(tokenInAddress),
    fetchPoolsForToken(tokenOutAddress)
  ])

  // Find pools that contain both tokens
  const tokenInLower = tokenInAddress.toLowerCase()
  const tokenOutLower = tokenOutAddress.toLowerCase()
  
  const commonPools = poolsForTokenIn.filter(pool => 
    pool.tokens.some(token => token.address.toLowerCase() === tokenOutLower)
  )

  // Sort by liquidity (highest first)
  return commonPools.sort((a, b) => 
    parseFloat(b.totalLiquidity) - parseFloat(a.totalLiquidity)
  )
}

/**
 * Get token information from a pool
 */
export function getTokenFromPool(pool: BalancerPool, tokenAddress: string) {
  return pool.tokens.find(token => 
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  )
}

/**
 * Calculate pool swap fee in basis points
 */
export function getPoolSwapFeeBps(pool: BalancerPool): number {
  return Math.round(pool.swapFee * 10000)
}

/**
 * Clear pool cache (useful for testing or manual refresh)
 */
export function clearPoolCache(): void {
  poolCache.clear()
}

/**
 * Get cache statistics
 */
export function getPoolCacheStats(): { size: number; entries: string[] } {
  return {
    size: poolCache.size,
    entries: Array.from(poolCache.keys())
  }
} 