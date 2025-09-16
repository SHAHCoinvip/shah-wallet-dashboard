import { parseEther, formatEther } from 'viem'
import { BalancerPool, findPoolsForPair, getTokenFromPool, getPoolSwapFeeBps } from './pools'
import { ROUTING } from '@/config/routing'

export interface BalancerQuoteParams {
  tokenInAddress: string
  tokenOutAddress: string
  amountIn: string // In wei
  slippageBps: number
}

export interface BalancerQuote {
  amountOut: string // In wei
  priceImpactBps: number
  routeLabel: string
  hops: number
  pool: BalancerPool
  effectiveSlippageBps: number
}

/**
 * Calculate swap output for a weighted pool (simplified)
 */
function calculateWeightedPoolSwap(
  pool: BalancerPool,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string
): { amountOut: string; priceImpactBps: number } {
  const tokenIn = getTokenFromPool(pool, tokenInAddress)
  const tokenOut = getTokenFromPool(pool, tokenOutAddress)
  
  if (!tokenIn || !tokenOut || !tokenIn.weight || !tokenOut.weight) {
    throw new Error('Invalid pool or missing weights')
  }

  const balanceIn = parseFloat(tokenIn.balance)
  const balanceOut = parseFloat(tokenOut.balance)
  const weightIn = tokenIn.weight
  const weightOut = tokenOut.weight
  const amountInFloat = parseFloat(formatEther(BigInt(amountIn)))

  // Simplified constant product formula with weights
  const k = Math.pow(balanceIn, weightIn) * Math.pow(balanceOut, weightOut)
  const newBalanceIn = balanceIn + amountInFloat
  const newBalanceOut = Math.pow(k / Math.pow(newBalanceIn, weightIn), 1 / weightOut)
  const amountOutFloat = balanceOut - newBalanceOut

  // Apply swap fee
  const swapFeeBps = getPoolSwapFeeBps(pool)
  const feeMultiplier = 1 - (swapFeeBps / 10000)
  const amountOutAfterFee = amountOutFloat * feeMultiplier

  // Calculate price impact
  const spotPrice = balanceOut / balanceIn
  const executionPrice = amountOutAfterFee / amountInFloat
  const priceImpact = Math.abs((spotPrice - executionPrice) / spotPrice) * 10000

  return {
    amountOut: parseEther(amountOutAfterFee.toString()).toString(),
    priceImpactBps: Math.round(priceImpact)
  }
}

/**
 * Calculate swap output for a stable pool (simplified)
 */
function calculateStablePoolSwap(
  pool: BalancerPool,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string
): { amountOut: string; priceImpactBps: number } {
  const tokenIn = getTokenFromPool(pool, tokenInAddress)
  const tokenOut = getTokenFromPool(pool, tokenOutAddress)
  
  if (!tokenIn || !tokenOut) {
    throw new Error('Invalid pool')
  }

  const balanceIn = parseFloat(tokenIn.balance)
  const balanceOut = parseFloat(tokenOut.balance)
  const amountInFloat = parseFloat(formatEther(BigInt(amountIn)))

  // Simplified stable pool calculation (constant sum with small slippage)
  const amp = pool.amp || 100
  const amplification = amp / 100

  // Calculate output using amplification factor
  const invariant = balanceIn + balanceOut
  const newBalanceIn = balanceIn + amountInFloat
  const newBalanceOut = invariant - newBalanceIn
  const amountOutFloat = balanceOut - newBalanceOut

  // Apply amplification factor
  const amplifiedAmountOut = amountOutFloat * amplification

  // Apply swap fee
  const swapFeeBps = getPoolSwapFeeBps(pool)
  const feeMultiplier = 1 - (swapFeeBps / 10000)
  const amountOutAfterFee = amplifiedAmountOut * feeMultiplier

  // Calculate price impact (simplified)
  const priceImpact = Math.abs(amountInFloat / balanceIn) * 10000

  return {
    amountOut: parseEther(amountOutAfterFee.toString()).toString(),
    priceImpactBps: Math.round(priceImpact)
  }
}

/**
 * Get Balancer quote for a token pair
 */
export async function getBalancerQuote(params: BalancerQuoteParams): Promise<BalancerQuote | null> {
  const { tokenInAddress, tokenOutAddress, amountIn, slippageBps } = params

  try {
    // Find pools for this pair
    const pools = await findPoolsForPair(tokenInAddress, tokenOutAddress)
    
    if (pools.length === 0) {
      return null
    }

    // Try each pool and find the best quote
    let bestQuote: BalancerQuote | null = null

    for (const pool of pools) {
      try {
        let quote: { amountOut: string; priceImpactBps: number }

        switch (pool.poolType) {
          case 'Weighted':
            quote = calculateWeightedPoolSwap(pool, tokenInAddress, tokenOutAddress, amountIn)
            break
          case 'Stable':
          case 'ComposableStable':
            quote = calculateStablePoolSwap(pool, tokenInAddress, tokenOutAddress, amountIn)
            break
          default:
            continue // Skip unsupported pool types
        }

        // Check price impact threshold
        if (quote.priceImpactBps > ROUTING.priceImpactThresholdBps) {
          continue
        }

        // Apply slippage tolerance
        const effectiveSlippageBps = Math.min(slippageBps, ROUTING.balancerMaxSlippageBps)
        const slippageMultiplier = 1 - (effectiveSlippageBps / 10000)
        const amountOutWithSlippage = BigInt(quote.amountOut) * BigInt(Math.floor(slippageMultiplier * 10000)) / 10000n

        const balancerQuote: BalancerQuote = {
          amountOut: amountOutWithSlippage.toString(),
          priceImpactBps: quote.priceImpactBps,
          routeLabel: `Balancer ${pool.poolType}`,
          hops: 1, // Direct swap
          pool,
          effectiveSlippageBps
        }

        // Update best quote if this one is better
        if (!bestQuote || BigInt(balancerQuote.amountOut) > BigInt(bestQuote.amountOut)) {
          bestQuote = balancerQuote
        }

      } catch (error) {
        console.warn(`Failed to calculate quote for pool ${pool.id}:`, error)
        continue
      }
    }

    return bestQuote

  } catch (error) {
    console.warn('Failed to get Balancer quote:', error)
    return null
  }
}

/**
 * Get multiple Balancer quotes for comparison
 */
export async function getBalancerQuotes(params: BalancerQuoteParams): Promise<BalancerQuote[]> {
  const { tokenInAddress, tokenOutAddress, amountIn, slippageBps } = params

  try {
    const pools = await findPoolsForPair(tokenInAddress, tokenOutAddress)
    const quotes: BalancerQuote[] = []

    for (const pool of pools) {
      try {
        let quote: { amountOut: string; priceImpactBps: number }

        switch (pool.poolType) {
          case 'Weighted':
            quote = calculateWeightedPoolSwap(pool, tokenInAddress, tokenOutAddress, amountIn)
            break
          case 'Stable':
          case 'ComposableStable':
            quote = calculateStablePoolSwap(pool, tokenInAddress, tokenOutAddress, amountIn)
            break
          default:
            continue
        }

        if (quote.priceImpactBps > ROUTING.priceImpactThresholdBps) {
          continue
        }

        const effectiveSlippageBps = Math.min(slippageBps, ROUTING.balancerMaxSlippageBps)
        const slippageMultiplier = 1 - (effectiveSlippageBps / 10000)
        const amountOutWithSlippage = BigInt(quote.amountOut) * BigInt(Math.floor(slippageMultiplier * 10000)) / 10000n

        quotes.push({
          amountOut: amountOutWithSlippage.toString(),
          priceImpactBps: quote.priceImpactBps,
          routeLabel: `Balancer ${pool.poolType}`,
          hops: 1,
          pool,
          effectiveSlippageBps
        })

      } catch (error) {
        console.warn(`Failed to calculate quote for pool ${pool.id}:`, error)
        continue
      }
    }

    // Sort by amount out (highest first)
    return quotes.sort((a, b) => 
      BigInt(b.amountOut) > BigInt(a.amountOut) ? 1 : -1
    )

  } catch (error) {
    console.warn('Failed to get Balancer quotes:', error)
    return []
  }
} 