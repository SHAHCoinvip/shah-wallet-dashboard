export interface BalancerPool {
  id: string
  name: string
  symbol: string
  totalLiquidity: number
  totalShares: string
  tokens: BalancerToken[]
  swapFee: number
  totalWeight: number
  apr: number
  volume24h: number
  fees24h: number
}

export interface BalancerToken {
  id: string
  address: string
  symbol: string
  name: string
  decimals: number
  weight: number
  balance: string
  priceRate: string
}

export interface BalancerSwapQuote {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  priceImpact: number
  fee: number
  route: BalancerRoute[]
}

export interface BalancerRoute {
  poolId: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
}

export class BalancerService {
  private subgraphUrl: string
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 30000 // 30 seconds

  constructor() {
    this.subgraphUrl = process.env.NEXT_PUBLIC_BALANCER_SUBGRAPH || 
                      'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
  }

  private async querySubgraph(query: string): Promise<any> {
    try {
      const response = await fetch(this.subgraphUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Balancer subgraph error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      return data.data
    } catch (error) {
      console.error('Balancer subgraph query error:', error)
      throw error
    }
  }

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async getPools(limit: number = 50, offset: number = 0): Promise<BalancerPool[]> {
    const cacheKey = `pools_${limit}_${offset}`
    const cached = this.getCached<BalancerPool[]>(cacheKey)
    if (cached) return cached

    const query = `
      query GetPools($limit: Int!, $offset: Int!) {
        pools(
          first: $limit
          skip: $offset
          orderBy: totalLiquidity
          orderDirection: desc
          where: { totalLiquidity_gt: "1000000" }
        ) {
          id
          name
          symbol
          totalLiquidity
          totalShares
          swapFee
          totalWeight
          tokens {
            id
            address
            symbol
            name
            decimals
            weight
            balance
            priceRate
          }
          swaps(first: 1, orderBy: timestamp, orderDirection: desc) {
            timestamp
          }
        }
      }
    `

    try {
      const data = await this.querySubgraph(query)
      const pools = data.pools.map((pool: any) => this.transformPool(pool))
      
      this.setCache(cacheKey, pools)
      return pools
    } catch (error) {
      console.error('Failed to fetch Balancer pools:', error)
      return this.getMockPools()
    }
  }

  async getPoolById(poolId: string): Promise<BalancerPool | null> {
    const cacheKey = `pool_${poolId}`
    const cached = this.getCached<BalancerPool>(cacheKey)
    if (cached) return cached

    const query = `
      query GetPool($poolId: ID!) {
        pool(id: $poolId) {
          id
          name
          symbol
          totalLiquidity
          totalShares
          swapFee
          totalWeight
          tokens {
            id
            address
            symbol
            name
            decimals
            weight
            balance
            priceRate
          }
          swaps(first: 100, orderBy: timestamp, orderDirection: desc) {
            timestamp
            tokenAmountIn
            tokenAmountOut
            tokenIn
            tokenOut
          }
        }
      }
    `

    try {
      const data = await this.querySubgraph(query)
      if (!data.pool) return null

      const pool = this.transformPool(data.pool)
      this.setCache(cacheKey, pool)
      return pool
    } catch (error) {
      console.error(`Failed to fetch pool ${poolId}:`, error)
      return null
    }
  }

  async getPoolsByTokens(tokenAddresses: string[]): Promise<BalancerPool[]> {
    const query = `
      query GetPoolsByTokens($tokenAddresses: [String!]!) {
        pools(
          where: { 
            tokens_: { address_in: $tokenAddresses }
            totalLiquidity_gt: "100000"
          }
          orderBy: totalLiquidity
          orderDirection: desc
        ) {
          id
          name
          symbol
          totalLiquidity
          totalShares
          swapFee
          totalWeight
          tokens {
            id
            address
            symbol
            name
            decimals
            weight
            balance
            priceRate
          }
        }
      }
    `

    try {
      const data = await this.querySubgraph(query)
      return data.pools.map((pool: any) => this.transformPool(pool))
    } catch (error) {
      console.error('Failed to fetch pools by tokens:', error)
      return []
    }
  }

  async getSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    poolIds?: string[]
  ): Promise<BalancerSwapQuote | null> {
    // For now, we'll implement a simplified quote calculation
    // In production, you'd want to use Balancer's SDK or API for accurate quotes
    
    try {
      const pools = poolIds 
        ? await Promise.all(poolIds.map(id => this.getPoolById(id)))
        : await this.getPoolsByTokens([tokenIn, tokenOut])

      const validPools = pools.filter(pool => pool !== null) as BalancerPool[]
      
      if (validPools.length === 0) return null

      // Find the best pool for this swap
      const bestPool = validPools.find(pool => 
        pool.tokens.some(t => t.address.toLowerCase() === tokenIn.toLowerCase()) &&
        pool.tokens.some(t => t.address.toLowerCase() === tokenOut.toLowerCase())
      )

      if (!bestPool) return null

      // Simplified quote calculation (in production, use proper AMM math)
      const tokenInData = bestPool.tokens.find(t => 
        t.address.toLowerCase() === tokenIn.toLowerCase()
      )
      const tokenOutData = bestPool.tokens.find(t => 
        t.address.toLowerCase() === tokenOut.toLowerCase()
      )

      if (!tokenInData || !tokenOutData) return null

      const amountInNum = parseFloat(amountIn)
      const tokenInBalance = parseFloat(tokenInData.balance)
      const tokenOutBalance = parseFloat(tokenOutData.balance)
      
      // Constant product formula (simplified)
      const amountOut = (amountInNum * tokenOutBalance) / (tokenInBalance + amountInNum)
      const fee = amountInNum * bestPool.swapFee
      const amountOutAfterFee = amountOut - fee

      return {
        tokenIn,
        tokenOut,
        amountIn,
        amountOut: amountOutAfterFee.toString(),
        priceImpact: ((amountInNum / tokenInBalance) * 100),
        fee,
        route: [{
          poolId: bestPool.id,
          tokenIn,
          tokenOut,
          amountIn,
          amountOut: amountOutAfterFee.toString()
        }]
      }
    } catch (error) {
      console.error('Failed to get swap quote:', error)
      return null
    }
  }

  private transformPool(poolData: any): BalancerPool {
    const tokens = poolData.tokens.map((token: any) => ({
      id: token.id,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: parseInt(token.decimals),
      weight: parseFloat(token.weight || '0'),
      balance: token.balance,
      priceRate: token.priceRate || '1'
    }))

    // Calculate APR (simplified - in production you'd want more accurate calculation)
    const apr = this.calculateAPR(poolData)
    
    // Calculate 24h volume and fees (simplified)
    const volume24h = this.calculate24hVolume(poolData)
    const fees24h = volume24h * parseFloat(poolData.swapFee)

    return {
      id: poolData.id,
      name: poolData.name || `Balancer Pool ${poolData.id.slice(0, 8)}`,
      symbol: poolData.symbol || 'BPT',
      totalLiquidity: parseFloat(poolData.totalLiquidity),
      totalShares: poolData.totalShares,
      tokens,
      swapFee: parseFloat(poolData.swapFee),
      totalWeight: parseFloat(poolData.totalWeight),
      apr,
      volume24h,
      fees24h
    }
  }

  private calculateAPR(poolData: any): number {
    // Simplified APR calculation
    // In production, you'd want to calculate based on actual swap fees and volume
    return 5.5 + Math.random() * 10 // Mock APR between 5.5% and 15.5%
  }

  private calculate24hVolume(poolData: any): number {
    // Simplified volume calculation
    // In production, you'd aggregate actual swap data
    return parseFloat(poolData.totalLiquidity) * 0.1 // Assume 10% of TVL as daily volume
  }

  private getMockPools(): BalancerPool[] {
    return [
      {
        id: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
        name: 'Balancer 50WETH-50USDC',
        symbol: 'BPT',
        totalLiquidity: 50000000,
        totalShares: '1000000000000000000000',
        tokens: [
          {
            id: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            weight: 0.5,
            balance: '25000000000000000000',
            priceRate: '1'
          },
          {
            id: '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014-0xa0b86a33e6441b8c4c8c8c8c8c8c8c8c8c8c8c8c',
            address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            weight: 0.5,
            balance: '25000000000',
            priceRate: '1'
          }
        ],
        swapFee: 0.003,
        totalWeight: 1,
        apr: 12.5,
        volume24h: 5000000,
        fees24h: 15000
      }
    ]
  }

  // Utility methods
  async getPoolTVL(poolId: string): Promise<number> {
    const pool = await this.getPoolById(poolId)
    return pool?.totalLiquidity || 0
  }

  async getPoolAPR(poolId: string): Promise<number> {
    const pool = await this.getPoolById(poolId)
    return pool?.apr || 0
  }

  async getPoolTokens(poolId: string): Promise<BalancerToken[]> {
    const pool = await this.getPoolById(poolId)
    return pool?.tokens || []
  }
}

// Export singleton instance
export const balancerService = new BalancerService() 