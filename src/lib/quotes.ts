import { parseEther, formatEther } from 'viem'
import { ROUTING } from '@/config/routing'
import { getBalancerQuote, BalancerQuote } from './balancer/quote'

export interface QuoteParams {
  tokenInAddress: string
  tokenOutAddress: string
  amountIn: string // In wei
  slippageBps: number
}

export interface ShahSwapQuote {
  amountOut: string // In wei
  priceImpactBps: number
  routeLabel: string
  hops: number
  effectiveSlippageBps: number
}

export interface BestQuote {
  best: 'ShahSwap' | 'Balancer'
  quote: ShahSwapQuote | BalancerQuote
  alternatives: {
    shahSwap?: ShahSwapQuote
    balancer?: BalancerQuote
  }
}

/**
 * Get ShahSwap quote (existing implementation)
 * This is a simplified version - in reality, this would call the ShahSwap contract
 */
export async function getShahSwapQuote(params: QuoteParams): Promise<ShahSwapQuote | null> {
  const { tokenInAddress, tokenOutAddress, amountIn, slippageBps } = params

  try {
    // This is a placeholder - in the real implementation, this would:
    // 1. Call ShahSwap contract's getAmountsOut function
    // 2. Calculate price impact
    // 3. Apply slippage tolerance
    
    // For now, we'll simulate a basic quote
    const amountInFloat = parseFloat(formatEther(BigInt(amountIn)))
    
    // Simulate a simple swap with 0.3% fee (like Uniswap V2)
    const fee = 0.003
    const amountOutBeforeFee = amountInFloat * 1.0 // 1:1 ratio for demo
    const amountOutAfterFee = amountOutBeforeFee * (1 - fee)
    
    // Apply slippage
    const slippageMultiplier = 1 - (slippageBps / 10000)
    const amountOutWithSlippage = amountOutAfterFee * slippageMultiplier
    
    // Calculate price impact (simplified)
    const priceImpact = fee * 10000 // 30 basis points

    return {
      amountOut: parseEther(amountOutWithSlippage.toString()).toString(),
      priceImpactBps: Math.round(priceImpact),
      routeLabel: 'ShahSwap',
      hops: 1,
      effectiveSlippageBps: slippageBps
    }

  } catch (error) {
    console.warn('Failed to get ShahSwap quote:', error)
    return null
  }
}

/**
 * Get Balancer quote (wrapper around the Balancer quote function)
 */
export async function getBalancerQuoteWrapper(params: QuoteParams): Promise<BalancerQuote | null> {
  if (!ROUTING.enableBalancer) {
    return null
  }

  try {
    return await getBalancerQuote({
      tokenInAddress: params.tokenInAddress,
      tokenOutAddress: params.tokenOutAddress,
      amountIn: params.amountIn,
      slippageBps: params.slippageBps
    })
  } catch (error) {
    console.warn('Failed to get Balancer quote:', error)
    return null
  }
}

/**
 * Get the best quote by comparing ShahSwap and Balancer
 */
export async function getBestQuote(params: QuoteParams): Promise<BestQuote | null> {
  const { tokenInAddress, tokenOutAddress, amountIn, slippageBps } = params

  try {
    // Get quotes from both sources in parallel
    const [shahSwapQuote, balancerQuote] = await Promise.allSettled([
      getShahSwapQuote(params),
      getBalancerQuoteWrapper(params)
    ])

    const shahSwap = shahSwapQuote.status === 'fulfilled' ? shahSwapQuote.value : null
    const balancer = balancerQuote.status === 'fulfilled' ? balancerQuote.value : null

    // If neither quote is available, return null
    if (!shahSwap && !balancer) {
      return null
    }

    // If only one quote is available, use that one
    if (!shahSwap && balancer) {
      return {
        best: 'Balancer',
        quote: balancer,
        alternatives: { balancer }
      }
    }

    if (shahSwap && !balancer) {
      return {
        best: 'ShahSwap',
        quote: shahSwap,
        alternatives: { shahSwap }
      }
    }

    // Compare both quotes and choose the best one
    if (shahSwap && balancer) {
      const shahSwapAmount = BigInt(shahSwap.amountOut)
      const balancerAmount = BigInt(balancer.amountOut)

      if (balancerAmount > shahSwapAmount) {
        return {
          best: 'Balancer',
          quote: balancer,
          alternatives: { shahSwap, balancer }
        }
      } else {
        return {
          best: 'ShahSwap',
          quote: shahSwap,
          alternatives: { shahSwap, balancer }
        }
      }
    }

    return null

  } catch (error) {
    console.warn('Failed to get best quote:', error)
    return null
  }
}

/**
 * Get all available quotes for comparison
 */
export async function getAllQuotes(params: QuoteParams): Promise<{
  shahSwap: ShahSwapQuote | null
  balancer: BalancerQuote | null
  best: 'ShahSwap' | 'Balancer' | null
}> {
  try {
    const [shahSwapQuote, balancerQuote] = await Promise.allSettled([
      getShahSwapQuote(params),
      getBalancerQuoteWrapper(params)
    ])

    const shahSwap = shahSwapQuote.status === 'fulfilled' ? shahSwapQuote.value : null
    const balancer = balancerQuote.status === 'fulfilled' ? balancerQuote.value : null

    let best: 'ShahSwap' | 'Balancer' | null = null

    if (shahSwap && balancer) {
      const shahSwapAmount = BigInt(shahSwap.amountOut)
      const balancerAmount = BigInt(balancer.amountOut)
      best = balancerAmount > shahSwapAmount ? 'Balancer' : 'ShahSwap'
    } else if (shahSwap) {
      best = 'ShahSwap'
    } else if (balancer) {
      best = 'Balancer'
    }

    return {
      shahSwap,
      balancer,
      best
    }

  } catch (error) {
    console.warn('Failed to get all quotes:', error)
    return {
      shahSwap: null,
      balancer: null,
      best: null
    }
  }
}

/**
 * Check if Balancer routing is enabled and available
 */
export function isBalancerRoutingEnabled(): boolean {
  return ROUTING.enableBalancer
}

/**
 * Get routing configuration for UI display
 */
export function getRoutingConfig() {
  return {
    enableBalancer: ROUTING.enableBalancer,
    maxSlippageBps: ROUTING.balancerMaxSlippageBps,
    priceImpactThresholdBps: ROUTING.priceImpactThresholdBps
  }
} 