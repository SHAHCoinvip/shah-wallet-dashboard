import { getNetworkById, SUPPORTED_NETWORKS } from '@/config/networks'

export interface GasPrice {
  slow: number
  standard: number
  fast: number
  rapid: number
  baseFee?: number
  priorityFee?: number
}

export interface NetworkGasInfo {
  networkId: number
  networkName: string
  gasPrice: GasPrice
  estimatedCost: {
    slow: number
    standard: number
    fast: number
    rapid: number
  }
  usdCost: {
    slow: number
    standard: number
    fast: number
    rapid: number
  }
  nativeTokenPrice: number
  isRecommended: boolean
  recommendationReason?: string
}

export interface GasRecommendation {
  bestNetwork: NetworkGasInfo
  alternatives: NetworkGasInfo[]
  savings: {
    network: string
    savingsPercent: number
    savingsUsd: number
  }[]
  tips: string[]
}

// Mock gas price data - in production, this would come from APIs
const MOCK_GAS_PRICES: Record<number, GasPrice> = {
  1: { // Ethereum
    slow: 15,
    standard: 25,
    fast: 35,
    rapid: 50,
    baseFee: 20,
    priorityFee: 5
  },
  137: { // Polygon
    slow: 30,
    standard: 50,
    fast: 100,
    rapid: 200,
    baseFee: 30,
    priorityFee: 20
  },
  56: { // BSC
    slow: 3,
    standard: 5,
    fast: 8,
    rapid: 12,
    baseFee: 3,
    priorityFee: 2
  },
  42161: { // Arbitrum
    slow: 0.1,
    standard: 0.2,
    fast: 0.5,
    rapid: 1,
    baseFee: 0.1,
    priorityFee: 0.1
  },
  10: { // Optimism
    slow: 0.1,
    standard: 0.2,
    fast: 0.5,
    rapid: 1,
    baseFee: 0.1,
    priorityFee: 0.1
  }
}

// Mock token prices
const MOCK_TOKEN_PRICES: Record<number, number> = {
  1: 2000, // ETH
  137: 0.8, // MATIC
  56: 300, // BNB
  42161: 2000, // ETH on Arbitrum
  10: 2000, // ETH on Optimism
}

export const fetchGasPrices = async (networkId: number): Promise<GasPrice> => {
  // In production, this would fetch from gas price APIs
  // For now, return mock data
  return MOCK_GAS_PRICES[networkId] || MOCK_GAS_PRICES[1]
}

export const fetchTokenPrice = async (networkId: number): Promise<number> => {
  // In production, this would fetch from price APIs
  return MOCK_TOKEN_PRICES[networkId] || MOCK_TOKEN_PRICES[1]
}

export const calculateTransactionCost = (
  gasPrice: number,
  gasLimit: number,
  tokenPrice: number
): number => {
  return (gasPrice * gasLimit * tokenPrice) / 1e18
}

export const compareGasCosts = async (
  gasLimit: number = 21000,
  currentNetworkId: number = 1
): Promise<GasRecommendation> => {
  const networks = SUPPORTED_NETWORKS.filter(n => n.id !== currentNetworkId)
  const networkGasInfos: NetworkGasInfo[] = []

  // Get current network info
  const currentGasPrice = await fetchGasPrices(currentNetworkId)
  const currentTokenPrice = await fetchTokenPrice(currentNetworkId)
  const currentNetwork = getNetworkById(currentNetworkId)

  const currentNetworkInfo: NetworkGasInfo = {
    networkId: currentNetworkId,
    networkName: currentNetwork?.name || 'Unknown',
    gasPrice: currentGasPrice,
    estimatedCost: {
      slow: calculateTransactionCost(currentGasPrice.slow, gasLimit, currentTokenPrice),
      standard: calculateTransactionCost(currentGasPrice.standard, gasLimit, currentTokenPrice),
      fast: calculateTransactionCost(currentGasPrice.fast, gasLimit, currentTokenPrice),
      rapid: calculateTransactionCost(currentGasPrice.rapid, gasLimit, currentTokenPrice),
    },
    usdCost: {
      slow: (currentGasPrice.slow * gasLimit * currentTokenPrice) / 1e18,
      standard: (currentGasPrice.standard * gasLimit * currentTokenPrice) / 1e18,
      fast: (currentGasPrice.fast * gasLimit * currentTokenPrice) / 1e18,
      rapid: (currentGasPrice.rapid * gasLimit * currentTokenPrice) / 1e18,
    },
    nativeTokenPrice: currentTokenPrice,
    isRecommended: false,
  }

  networkGasInfos.push(currentNetworkInfo)

  // Get other networks
  for (const network of networks) {
    const gasPrice = await fetchGasPrices(network.id)
    const tokenPrice = await fetchTokenPrice(network.id)

    const networkInfo: NetworkGasInfo = {
      networkId: network.id,
      networkName: network.name,
      gasPrice,
      estimatedCost: {
        slow: calculateTransactionCost(gasPrice.slow, gasLimit, tokenPrice),
        standard: calculateTransactionCost(gasPrice.standard, gasLimit, tokenPrice),
        fast: calculateTransactionCost(gasPrice.fast, gasLimit, tokenPrice),
        rapid: calculateTransactionCost(gasPrice.rapid, gasLimit, tokenPrice),
      },
      usdCost: {
        slow: (gasPrice.slow * gasLimit * tokenPrice) / 1e18,
        standard: (gasPrice.standard * gasLimit * tokenPrice) / 1e18,
        fast: (gasPrice.fast * gasLimit * tokenPrice) / 1e18,
        rapid: (gasPrice.rapid * gasLimit * tokenPrice) / 1e18,
      },
      nativeTokenPrice: tokenPrice,
      isRecommended: false,
    }

    networkGasInfos.push(networkInfo)
  }

  // Find the cheapest network
  const cheapest = networkGasInfos.reduce((prev, current) => 
    current.usdCost.standard < prev.usdCost.standard ? current : prev
  )

  cheapest.isRecommended = true
  cheapest.recommendationReason = 'Lowest gas cost'

  // Calculate savings
  const savings = networkGasInfos
    .filter(n => n.networkId !== currentNetworkId)
    .map(network => {
      const currentCost = currentNetworkInfo.usdCost.standard
      const networkCost = network.usdCost.standard
      const savingsUsd = currentCost - networkCost
      const savingsPercent = ((savingsUsd / currentCost) * 100)

      return {
        network: network.networkName,
        savingsPercent: Math.max(0, savingsPercent),
        savingsUsd: Math.max(0, savingsUsd)
      }
    })
    .filter(s => s.savingsUsd > 0)
    .sort((a, b) => b.savingsUsd - a.savingsUsd)

  // Generate tips
  const tips: string[] = []
  
  if (currentNetworkId === 1 && cheapest.networkId !== 1) {
    tips.push(`Consider using ${cheapest.networkName} for 90%+ gas savings`)
  }
  
  if (gasLimit > 21000) {
    tips.push('Optimize your transaction to reduce gas usage')
  }
  
  if (currentGasPrice.fast > currentGasPrice.standard * 1.5) {
    tips.push('Gas prices are high - consider waiting or using a Layer 2')
  }

  return {
    bestNetwork: cheapest,
    alternatives: networkGasInfos.filter(n => n.networkId !== cheapest.networkId),
    savings,
    tips
  }
}

export const getGasOptimizationTips = (
  networkId: number,
  gasPrice: GasPrice,
  gasLimit: number
): string[] => {
  const tips: string[] = []

  // Check if gas prices are high
  if (networkId === 1 && gasPrice.standard > 50) {
    tips.push('Ethereum gas prices are high - consider using Layer 2 networks')
  }

  // Check for EIP-1559 optimization
  if (gasPrice.baseFee && gasPrice.priorityFee) {
    const totalFee = gasPrice.baseFee + gasPrice.priorityFee
    if (totalFee > gasPrice.standard * 1.2) {
      tips.push('Consider adjusting priority fee for better cost optimization')
    }
  }

  // Check gas limit
  if (gasLimit > 21000) {
    tips.push('Transaction gas limit is high - check for optimization opportunities')
  }

  // Network-specific tips
  switch (networkId) {
    case 1: // Ethereum
      tips.push('Use EIP-1559 for better gas price prediction')
      break
    case 137: // Polygon
      tips.push('Polygon has low gas fees - no optimization needed')
      break
    case 56: // BSC
      tips.push('BSC has very low gas fees - standard priority is fine')
      break
    case 42161: // Arbitrum
      tips.push('Arbitrum uses L1 gas pricing - check L1 gas prices')
      break
    case 10: // Optimism
      tips.push('Optimism uses L1 gas pricing - check L1 gas prices')
      break
  }

  return tips
}

export const estimateGasForTransaction = (
  transactionType: 'transfer' | 'swap' | 'stake' | 'approve' | 'custom',
  complexity: 'simple' | 'medium' | 'complex' = 'simple'
): number => {
  const baseGasLimits = {
    transfer: 21000,
    swap: 150000,
    stake: 80000,
    approve: 46000,
    custom: 100000
  }

  const complexityMultipliers = {
    simple: 1,
    medium: 1.5,
    complex: 2.5
  }

  const baseLimit = baseGasLimits[transactionType]
  const multiplier = complexityMultipliers[complexity]

  return Math.round(baseLimit * multiplier)
} 