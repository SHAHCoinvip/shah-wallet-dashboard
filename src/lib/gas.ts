import { ethers } from 'ethers'

export interface FeeData {
  baseFee: bigint
  maxPriorityFeeSuggestions: {
    slow: bigint
    avg: bigint
    fast: bigint
  }
  maxFeePerGas: bigint
}

export interface GasEstimate {
  gasLimit: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

export interface TxCost {
  eth: string
  usd: string
}

export async function getFeeData(provider: ethers.Provider): Promise<FeeData> {
  try {
    // Try external oracle first if configured
    if (process.env.NEXT_PUBLIC_GAS_ORACLE_URL) {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_GAS_ORACLE_URL)
        if (response.ok) {
          const oracleData = await response.json()
          
          // Parse BlockNative format
          if (oracleData.blockPrices && oracleData.blockPrices[0]) {
            const blockPrice = oracleData.blockPrices[0]
            const baseFee = ethers.parseUnits(blockPrice.baseFeePerGas, 'wei')
            
            return {
              baseFee,
              maxPriorityFeeSuggestions: {
                slow: ethers.parseUnits(blockPrice.estimatedPrices[0].maxPriorityFeePerGas, 'wei'),
                avg: ethers.parseUnits(blockPrice.estimatedPrices[1].maxPriorityFeePerGas, 'wei'),
                fast: ethers.parseUnits(blockPrice.estimatedPrices[2].maxPriorityFeePerGas, 'wei')
              },
              maxFeePerGas: ethers.parseUnits(blockPrice.estimatedPrices[1].maxFeePerGas, 'wei')
            }
          }
        }
      } catch (error) {
        console.warn('Gas oracle failed, falling back to provider:', error)
      }
    }

    // Fallback to provider
    const feeData = await provider.getFeeData()
    const baseFee = feeData.lastBaseFeePerGas || 0n
    
    // Estimate priority fees based on base fee
    const slowPriority = baseFee * 1n / 10n  // 10% of base fee
    const avgPriority = baseFee * 2n / 10n   // 20% of base fee  
    const fastPriority = baseFee * 4n / 10n  // 40% of base fee

    return {
      baseFee,
      maxPriorityFeeSuggestions: {
        slow: slowPriority,
        avg: avgPriority,
        fast: fastPriority
      },
      maxFeePerGas: feeData.maxFeePerGas || (baseFee * 2n + avgPriority)
    }
  } catch (error) {
    console.error('Error getting fee data:', error)
    throw new Error('Failed to get gas fee data')
  }
}

export async function estimateTxCost(
  estimate: GasEstimate,
  provider: ethers.Provider
): Promise<TxCost> {
  try {
    const totalGasCost = estimate.gasLimit * estimate.maxFeePerGas
    const ethCost = ethers.formatEther(totalGasCost)
    
    // Get USD price
    let usdPrice = 0
    if (process.env.NEXT_PUBLIC_USD_PRICE_FEED) {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_USD_PRICE_FEED)
        if (response.ok) {
          const data = await response.json()
          usdPrice = data.ethereum?.usd || 0
        }
      } catch (error) {
        console.warn('USD price feed failed:', error)
      }
    }
    
    const usdCost = usdPrice > 0 ? (parseFloat(ethCost) * usdPrice).toFixed(2) : '0.00'
    
    return {
      eth: ethCost,
      usd: usdCost
    }
  } catch (error) {
    console.error('Error estimating transaction cost:', error)
    return {
      eth: '0',
      usd: '0.00'
    }
  }
}

export function formatGasPrice(gwei: bigint): string {
  return ethers.formatUnits(gwei, 'gwei')
}

export function parseGasPrice(gwei: string): bigint {
  return ethers.parseUnits(gwei, 'gwei')
}

export function isEIP1559Supported(provider: ethers.Provider): boolean {
  // Check if provider supports EIP-1559
  return 'getFeeData' in provider
} 