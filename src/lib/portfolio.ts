import { priceService, PriceData, HistoricalPrice } from './prices'
import { balancerService, BalancerPool } from './balancer'
import { formatUnits, parseUnits } from 'viem'

export interface PortfolioAsset {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balanceUSD: number
  price: number
  priceChange24h: number
  network: string
  chainId: number
}

export interface PortfolioPosition {
  type: 'token' | 'lp' | 'staked'
  asset: PortfolioAsset
  entryPrice?: number
  entryAmount?: string
  currentValue: number
  pnl: number
  pnlPercentage: number
  impermanentLoss?: number
  lpShare?: number
  poolId?: string
}

export interface PortfolioSummary {
  totalValue: number
  totalValueChange24h: number
  totalValueChange7d: number
  totalValueChange30d: number
  totalPnL: number
  totalPnLPercentage: number
  positions: PortfolioPosition[]
  historicalData: PortfolioHistoricalData[]
  topHoldings: PortfolioAsset[]
  networks: string[]
}

export interface PortfolioHistoricalData {
  timestamp: number
  totalValue: number
  totalPnL: number
}

export interface StakingPosition {
  poolId: string
  stakedAmount: string
  pendingRewards: string
  apr: number
  lockPeriod?: number
  unlockTime?: number
}

export class PortfolioService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 60000 // 1 minute

  constructor() {}

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

  async getPortfolioSummary(
    address: string,
    networks: string[] = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism']
  ): Promise<PortfolioSummary> {
    const cacheKey = `portfolio_${address}_${networks.join('_')}`
    const cached = this.getCached<PortfolioSummary>(cacheKey)
    if (cached) return cached

    try {
      // Get token balances across networks
      const tokenPositions = await this.getTokenPositions(address, networks)
      
      // Get LP positions
      const lpPositions = await this.getLPPositions(address)
      
      // Get staking positions
      const stakingPositions = await this.getStakingPositions(address)
      
      // Combine all positions
      const allPositions = [...tokenPositions, ...lpPositions, ...stakingPositions]
      
      // Calculate totals
      const totalValue = allPositions.reduce((sum, pos) => sum + pos.currentValue, 0)
      const totalPnL = allPositions.reduce((sum, pos) => sum + pos.pnl, 0)
      
      // Get historical data
      const historicalData = await this.getHistoricalData(address, 90)
      
      // Get top holdings
      const topHoldings = this.getTopHoldings(allPositions)
      
      // Calculate 24h, 7d, 30d changes
      const changes = await this.calculateValueChanges(address, totalValue)
      
      const summary: PortfolioSummary = {
        totalValue,
        totalValueChange24h: changes.change24h,
        totalValueChange7d: changes.change7d,
        totalValueChange30d: changes.change30d,
        totalPnL,
        totalPnLPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
        positions: allPositions,
        historicalData,
        topHoldings,
        networks
      }

      this.setCache(cacheKey, summary)
      return summary
    } catch (error) {
      console.error('Failed to get portfolio summary:', error)
      return this.getMockPortfolioSummary()
    }
  }

  private async getTokenPositions(
    address: string, 
    networks: string[]
  ): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = []
    
    // This would typically use multicall to get balances across networks
    // For now, we'll simulate with mock data
    const mockTokens = [
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
      { address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8', symbol: 'SHAH', name: 'SHAH Token', decimals: 18 }
    ]

    for (const network of networks) {
      for (const token of mockTokens) {
        try {
          // Mock balance - in production, use multicall
          const balance = this.getMockBalance(address, token.address, network)
          if (parseFloat(balance) > 0) {
            const price = await priceService.getPrice(token.symbol.toLowerCase())
            const balanceUSD = parseFloat(formatUnits(parseUnits(balance, token.decimals), token.decimals)) * price.price
            
            const position: PortfolioPosition = {
              type: 'token',
              asset: {
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance,
                balanceUSD,
                price: price.price,
                priceChange24h: price.change24h,
                network,
                chainId: this.getChainId(network)
              },
              currentValue: balanceUSD,
              pnl: 0, // Would calculate based on entry price
              pnlPercentage: 0
            }
            
            positions.push(position)
          }
        } catch (error) {
          console.error(`Failed to get token position for ${token.symbol} on ${network}:`, error)
        }
      }
    }

    return positions
  }

  private async getLPPositions(address: string): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = []
    
    try {
      // Get Balancer pools
      const pools = await balancerService.getPools(20)
      
      for (const pool of pools) {
        // Check if user has LP tokens (simplified)
        const lpBalance = this.getMockLPBalance(address, pool.id)
        if (parseFloat(lpBalance) > 0) {
          const lpValue = parseFloat(lpBalance) * pool.totalLiquidity / parseFloat(pool.totalShares)
          
          const position: PortfolioPosition = {
            type: 'lp',
            asset: {
              address: pool.id,
              symbol: pool.symbol,
              name: pool.name,
              decimals: 18,
              balance: lpBalance,
              balanceUSD: lpValue,
              price: pool.totalLiquidity / parseFloat(pool.totalShares),
              priceChange24h: 0, // Would calculate from pool data
              network: 'ethereum',
              chainId: 1
            },
            currentValue: lpValue,
            pnl: 0, // Would calculate based on entry
            pnlPercentage: 0,
            lpShare: parseFloat(lpBalance) / parseFloat(pool.totalShares),
            poolId: pool.id
          }
          
          positions.push(position)
        }
      }
    } catch (error) {
      console.error('Failed to get LP positions:', error)
    }

    return positions
  }

  private async getStakingPositions(address: string): Promise<PortfolioPosition[]> {
    const positions: PortfolioPosition[] = []
    
    // Mock staking positions
    const mockStaking = {
      stakedAmount: '1000000000000000000000', // 1000 SHAH
      pendingRewards: '50000000000000000000', // 50 SHAH
      apr: 12.5
    }
    
    if (parseFloat(mockStaking.stakedAmount) > 0) {
      try {
        const shahPrice = await priceService.getPrice('shah')
        const stakedValue = parseFloat(formatUnits(mockStaking.stakedAmount, 18)) * shahPrice.price
        const rewardsValue = parseFloat(formatUnits(mockStaking.pendingRewards, 18)) * shahPrice.price
        
        const position: PortfolioPosition = {
          type: 'staked',
          asset: {
            address: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
            symbol: 'SHAH',
            name: 'SHAH Token',
            decimals: 18,
            balance: mockStaking.stakedAmount,
            balanceUSD: stakedValue,
            price: shahPrice.price,
            priceChange24h: shahPrice.change24h,
            network: 'ethereum',
            chainId: 1
          },
          currentValue: stakedValue + rewardsValue,
          pnl: rewardsValue, // Pending rewards as PnL
          pnlPercentage: stakedValue > 0 ? (rewardsValue / stakedValue) * 100 : 0
        }
        
        positions.push(position)
      } catch (error) {
        console.error('Failed to get staking position:', error)
      }
    }

    return positions
  }

  private async getHistoricalData(
    address: string, 
    days: number
  ): Promise<PortfolioHistoricalData[]> {
    try {
      // Get SHAH price history as proxy for portfolio performance
      const shahHistory = await priceService.getHistoricalPrices('shah', days)
      
      return shahHistory.map((point, index) => ({
        timestamp: point.timestamp,
        totalValue: 10000 + (point.price - shahHistory[0].price) * 1000, // Mock portfolio value
        totalPnL: (point.price - shahHistory[0].price) * 1000 // Mock PnL
      }))
    } catch (error) {
      console.error('Failed to get historical data:', error)
      return []
    }
  }

  private getTopHoldings(positions: PortfolioPosition[]): PortfolioAsset[] {
    return positions
      .filter(pos => pos.currentValue > 100) // Only holdings > $100
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10)
      .map(pos => pos.asset)
  }

  private async calculateValueChanges(
    address: string, 
    currentValue: number
  ): Promise<{ change24h: number; change7d: number; change30d: number }> {
    try {
      // Mock changes based on SHAH price movement
      const shahPrice = await priceService.getPrice('shah')
      const change24h = currentValue * (shahPrice.change24h / 100)
      
      return {
        change24h,
        change7d: change24h * 7, // Simplified
        change30d: change24h * 30 // Simplified
      }
    } catch (error) {
      console.error('Failed to calculate value changes:', error)
      return { change24h: 0, change7d: 0, change30d: 0 }
    }
  }

  // Utility methods
  private getMockBalance(address: string, tokenAddress: string, network: string): string {
    // Mock balances - in production, use multicall
    const balances: Record<string, Record<string, string>> = {
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
        ethereum: '1000000000000000000', // 1 WETH
        polygon: '0',
        bsc: '0'
      },
      '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C': {
        ethereum: '1000000', // 1 USDC
        polygon: '5000000', // 5 USDC
        bsc: '0'
      },
      '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8': {
        ethereum: '1000000000000000000000', // 1000 SHAH
        polygon: '0',
        bsc: '0'
      }
    }
    
    return balances[tokenAddress]?.[network] || '0'
  }

  private getMockLPBalance(address: string, poolId: string): string {
    // Mock LP balance
    return '1000000000000000000' // 1 LP token
  }

  private getChainId(network: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      bsc: 56,
      arbitrum: 42161,
      optimism: 10
    }
    return chainIds[network] || 1
  }

  private getMockPortfolioSummary(): PortfolioSummary {
    return {
      totalValue: 15000,
      totalValueChange24h: 250,
      totalValueChange7d: 1500,
      totalValueChange30d: 3000,
      totalPnL: 2000,
      totalPnLPercentage: 15.38,
      positions: [],
      historicalData: [],
      topHoldings: [],
      networks: ['ethereum']
    }
  }

  // Public methods for specific use cases
  async getAssetPnL(
    address: string,
    tokenAddress: string,
    entryPrice: number,
    entryAmount: string
  ): Promise<{ pnl: number; pnlPercentage: number; currentValue: number }> {
    try {
      return await priceService.calculatePnL(tokenAddress, entryPrice, entryAmount)
    } catch (error) {
      console.error('Failed to calculate asset PnL:', error)
      return { pnl: 0, pnlPercentage: 0, currentValue: 0 }
    }
  }

  async getPortfolioPerformance(
    address: string,
    timeframe: '24h' | '7d' | '30d' | '90d'
  ): Promise<{ change: number; changePercentage: number }> {
    try {
      const summary = await this.getPortfolioSummary(address)
      
      switch (timeframe) {
        case '24h':
          return {
            change: summary.totalValueChange24h,
            changePercentage: summary.totalValue > 0 ? (summary.totalValueChange24h / summary.totalValue) * 100 : 0
          }
        case '7d':
          return {
            change: summary.totalValueChange7d,
            changePercentage: summary.totalValue > 0 ? (summary.totalValueChange7d / summary.totalValue) * 100 : 0
          }
        case '30d':
          return {
            change: summary.totalValueChange30d,
            changePercentage: summary.totalValue > 0 ? (summary.totalValueChange30d / summary.totalValue) * 100 : 0
          }
        case '90d':
          return {
            change: summary.totalPnL,
            changePercentage: summary.totalPnLPercentage
          }
        default:
          return { change: 0, changePercentage: 0 }
      }
    } catch (error) {
      console.error('Failed to get portfolio performance:', error)
      return { change: 0, changePercentage: 0 }
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService() 