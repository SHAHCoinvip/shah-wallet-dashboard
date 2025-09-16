import { parseUnits, formatUnits } from 'viem'

export interface GasPrice {
  slow: string
  standard: string
  fast: string
  instant: string
  baseFee: string
  priorityFee: {
    slow: string
    standard: string
    fast: string
    instant: string
  }
}

export interface NetworkGasInfo {
  chainId: number
  network: string
  gasPrice: GasPrice
  estimatedTime: {
    slow: number
    standard: number
    fast: number
    instant: number
  }
  isEIP1559: boolean
  lastUpdated: number
}

export interface OptimizedTransaction {
  chainId: number
  network: string
  gasPrice: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  estimatedGas: string
  estimatedCost: string
  estimatedTime: number
  savings: number // Percentage savings compared to default
}

export interface BatchTransaction {
  id: string
  transactions: OptimizedTransaction[]
  totalCost: string
  totalSavings: number
  estimatedTime: number
}

export interface GasOracleResponse {
  blockPrices: Array<{
    blockNumber: number
    estimatedTransactionCount: number
    baseFeePerGas: string
    estimatedPrices: Array<{
      confidence: number
      price: string
      maxPriorityFeePerGas: string
      maxFeePerGas: string
    }>
  }>
}

export class GasOptimizationService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 30000 // 30 seconds
  private readonly SUPPORTED_NETWORKS = [
    { chainId: 1, name: 'Ethereum', rpc: 'https://ethereum-rpc.publicnode.com' },
    { chainId: 137, name: 'Polygon', rpc: 'https://polygon-rpc.com' },
    { chainId: 56, name: 'BSC', rpc: 'https://bsc-dataseed.binance.org' },
    { chainId: 42161, name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc' },
    { chainId: 10, name: 'Optimism', rpc: 'https://mainnet.optimism.io' }
  ]

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

  // Get gas prices for a specific network
  async getGasPrices(chainId: number): Promise<NetworkGasInfo | null> {
    const cacheKey = `gas_${chainId}`
    const cached = this.getCached<NetworkGasInfo>(cacheKey)
    if (cached) return cached

    try {
      const network = this.SUPPORTED_NETWORKS.find(n => n.chainId === chainId)
      if (!network) return null

      let gasInfo: NetworkGasInfo

      if (chainId === 1) {
        // Ethereum - use EIP-1559
        gasInfo = await this.getEthereumGasPrices()
      } else {
        // Other networks - use legacy gas pricing
        gasInfo = await this.getLegacyGasPrices(chainId)
      }

      this.setCache(cacheKey, gasInfo)
      return gasInfo
    } catch (error) {
      console.error(`Failed to get gas prices for chain ${chainId}:`, error)
      return null
    }
  }

  // Get gas prices for all supported networks
  async getAllGasPrices(): Promise<NetworkGasInfo[]> {
    const gasInfos: NetworkGasInfo[] = []

    for (const network of this.SUPPORTED_NETWORKS) {
      try {
        const gasInfo = await this.getGasPrices(network.chainId)
        if (gasInfo) {
          gasInfos.push(gasInfo)
        }
      } catch (error) {
        console.error(`Failed to get gas prices for ${network.name}:`, error)
      }
    }

    return gasInfos
  }

  // Find the cheapest network for a transaction
  async findCheapestNetwork(
    estimatedGas: string,
    priority: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<OptimizedTransaction | null> {
    try {
      const allGasPrices = await this.getAllGasPrices()
      let cheapest: OptimizedTransaction | null = null

      for (const gasInfo of allGasPrices) {
        const gasPrice = gasInfo.gasPrice[priority]
        const estimatedCost = parseFloat(estimatedGas) * parseFloat(gasPrice)
        
        if (!cheapest || estimatedCost < parseFloat(cheapest.estimatedCost)) {
          cheapest = {
            chainId: gasInfo.chainId,
            network: gasInfo.network,
            gasPrice,
            maxFeePerGas: gasInfo.isEIP1559 ? gasInfo.gasPrice.fast : undefined,
            maxPriorityFeePerGas: gasInfo.isEIP1559 ? gasInfo.gasPrice.priorityFee[priority] : undefined,
            estimatedGas,
            estimatedCost: estimatedCost.toString(),
            estimatedTime: gasInfo.estimatedTime[priority],
            savings: 0 // Will be calculated later
          }
        }
      }

      if (cheapest) {
        // Calculate savings compared to Ethereum standard
        const ethereumGas = allGasPrices.find(g => g.chainId === 1)
        if (ethereumGas) {
          const ethereumCost = parseFloat(estimatedGas) * parseFloat(ethereumGas.gasPrice.standard)
          const savings = ((ethereumCost - parseFloat(cheapest.estimatedCost)) / ethereumCost) * 100
          cheapest.savings = Math.max(0, savings)
        }
      }

      return cheapest
    } catch (error) {
      console.error('Failed to find cheapest network:', error)
      return null
    }
  }

  // Optimize transaction for a specific network
  async optimizeTransaction(
    chainId: number,
    estimatedGas: string,
    priority: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<OptimizedTransaction | null> {
    try {
      const gasInfo = await this.getGasPrices(chainId)
      if (!gasInfo) return null

      const gasPrice = gasInfo.gasPrice[priority]
      const estimatedCost = parseFloat(estimatedGas) * parseFloat(gasPrice)

      return {
        chainId,
        network: gasInfo.network,
        gasPrice,
        maxFeePerGas: gasInfo.isEIP1559 ? gasInfo.gasPrice.fast : undefined,
        maxPriorityFeePerGas: gasInfo.isEIP1559 ? gasInfo.gasPrice.priorityFee[priority] : undefined,
        estimatedGas,
        estimatedCost: estimatedCost.toString(),
        estimatedTime: gasInfo.estimatedTime[priority],
        savings: 0
      }
    } catch (error) {
      console.error('Failed to optimize transaction:', error)
      return null
    }
  }

  // Batch multiple transactions
  async batchTransactions(
    transactions: Array<{
      chainId: number
      estimatedGas: string
      priority: 'slow' | 'standard' | 'fast' | 'instant'
    }>
  ): Promise<BatchTransaction | null> {
    try {
      const optimizedTxs: OptimizedTransaction[] = []
      let totalCost = 0

      for (const tx of transactions) {
        const optimized = await this.optimizeTransaction(tx.chainId, tx.estimatedGas, tx.priority)
        if (optimized) {
          optimizedTxs.push(optimized)
          totalCost += parseFloat(optimized.estimatedCost)
        }
      }

      if (optimizedTxs.length === 0) return null

      // Calculate total savings
      const ethereumCost = optimizedTxs.reduce((sum, tx) => {
        if (tx.chainId === 1) return sum + parseFloat(tx.estimatedCost)
        // Estimate what it would cost on Ethereum
        return sum + (parseFloat(tx.estimatedCost) * 1.5) // Rough estimate
      }, 0)

      const totalSavings = ((ethereumCost - totalCost) / ethereumCost) * 100

      return {
        id: `batch_${Date.now()}`,
        transactions: optimizedTxs,
        totalCost: totalCost.toString(),
        totalSavings: Math.max(0, totalSavings),
        estimatedTime: Math.max(...optimizedTxs.map(tx => tx.estimatedTime))
      }
    } catch (error) {
      console.error('Failed to batch transactions:', error)
      return null
    }
  }

  // Private methods for different gas pricing strategies
  private async getEthereumGasPrices(): Promise<NetworkGasInfo> {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GAS_ORACLE_URL || 
        'https://api.blocknative.com/gasprices/blockprices')
      
      if (!response.ok) {
        throw new Error(`Gas oracle error: ${response.status}`)
      }

      const data: GasOracleResponse = await response.json()
      const blockPrice = data.blockPrices[0]
      const baseFee = blockPrice.baseFeePerGas

      // Map confidence levels to speed categories
      const slow = blockPrice.estimatedPrices.find(p => p.confidence === 70)
      const standard = blockPrice.estimatedPrices.find(p => p.confidence === 80)
      const fast = blockPrice.estimatedPrices.find(p => p.confidence === 90)
      const instant = blockPrice.estimatedPrices.find(p => p.confidence === 95)

      return {
        chainId: 1,
        network: 'Ethereum',
        gasPrice: {
          slow: slow?.maxFeePerGas || '20000000000',
          standard: standard?.maxFeePerGas || '25000000000',
          fast: fast?.maxFeePerGas || '30000000000',
          instant: instant?.maxFeePerGas || '40000000000',
          baseFee,
          priorityFee: {
            slow: slow?.maxPriorityFeePerGas || '1500000000',
            standard: standard?.maxPriorityFeePerGas || '2000000000',
            fast: fast?.maxPriorityFeePerGas || '3000000000',
            instant: instant?.maxPriorityFeePerGas || '5000000000'
          }
        },
        estimatedTime: {
          slow: 300, // 5 minutes
          standard: 60, // 1 minute
          fast: 30, // 30 seconds
          instant: 10 // 10 seconds
        },
        isEIP1559: true,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Failed to get Ethereum gas prices:', error)
      // Return fallback values
      return this.getFallbackEthereumGasPrices()
    }
  }

  private async getLegacyGasPrices(chainId: number): Promise<NetworkGasInfo> {
    // For non-EIP-1559 networks, we'll use simplified gas pricing
    const network = this.SUPPORTED_NETWORKS.find(n => n.chainId === chainId)
    if (!network) throw new Error(`Unsupported network: ${chainId}`)

    // Mock gas prices - in production, you'd fetch from network-specific APIs
    const baseGasPrice = this.getBaseGasPrice(chainId)
    
    return {
      chainId,
      network: network.name,
      gasPrice: {
        slow: (parseFloat(baseGasPrice) * 0.8).toString(),
        standard: baseGasPrice,
        fast: (parseFloat(baseGasPrice) * 1.2).toString(),
        instant: (parseFloat(baseGasPrice) * 1.5).toString(),
        baseFee: baseGasPrice,
        priorityFee: {
          slow: '0',
          standard: '0',
          fast: '0',
          instant: '0'
        }
      },
      estimatedTime: {
        slow: 300,
        standard: 60,
        fast: 30,
        instant: 10
      },
      isEIP1559: false,
      lastUpdated: Date.now()
    }
  }

  private getBaseGasPrice(chainId: number): string {
    // Mock base gas prices for different networks
    const basePrices: Record<number, string> = {
      1: '25000000000', // 25 gwei
      137: '30000000000', // 30 gwei
      56: '5000000000', // 5 gwei
      42161: '100000000', // 0.1 gwei
      10: '1000000' // 0.001 gwei
    }
    return basePrices[chainId] || '25000000000'
  }

  private getFallbackEthereumGasPrices(): NetworkGasInfo {
    return {
      chainId: 1,
      network: 'Ethereum',
      gasPrice: {
        slow: '20000000000',
        standard: '25000000000',
        fast: '30000000000',
        instant: '40000000000',
        baseFee: '20000000000',
        priorityFee: {
          slow: '1500000000',
          standard: '2000000000',
          fast: '3000000000',
          instant: '5000000000'
        }
      },
      estimatedTime: {
        slow: 300,
        standard: 60,
        fast: 30,
        instant: 10
      },
      isEIP1559: true,
      lastUpdated: Date.now()
    }
  }

  // Utility methods
  async estimateTransactionCost(
    chainId: number,
    estimatedGas: string,
    priority: 'slow' | 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<{
    cost: string
    costUSD: string
    gasPrice: string
    estimatedTime: number
  } | null> {
    try {
      const gasInfo = await this.getGasPrices(chainId)
      if (!gasInfo) return null

      const gasPrice = gasInfo.gasPrice[priority]
      const cost = parseFloat(estimatedGas) * parseFloat(gasPrice)
      
      // Mock USD conversion - in production, use price feeds
      const ethPrice = 2000 // Mock ETH price
      const costUSD = cost * ethPrice / Math.pow(10, 18)

      return {
        cost: cost.toString(),
        costUSD: costUSD.toString(),
        gasPrice,
        estimatedTime: gasInfo.estimatedTime[priority]
      }
    } catch (error) {
      console.error('Failed to estimate transaction cost:', error)
      return null
    }
  }

  // Get recommended gas settings for a transaction
  async getRecommendedGasSettings(
    chainId: number,
    estimatedGas: string,
    urgency: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<{
    gasPrice: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    estimatedCost: string
    estimatedTime: number
  } | null> {
    const priorityMap = {
      low: 'slow' as const,
      medium: 'standard' as const,
      high: 'fast' as const
    }

    const optimized = await this.optimizeTransaction(chainId, estimatedGas, priorityMap[urgency])
    if (!optimized) return null

    return {
      gasPrice: optimized.gasPrice,
      maxFeePerGas: optimized.maxFeePerGas,
      maxPriorityFeePerGas: optimized.maxPriorityFeePerGas,
      estimatedCost: optimized.estimatedCost,
      estimatedTime: optimized.estimatedTime
    }
  }
}

// Export singleton instance
export const gasOptimizationService = new GasOptimizationService() 