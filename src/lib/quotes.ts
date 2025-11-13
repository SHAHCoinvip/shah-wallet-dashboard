import { createPublicClient, formatEther, http } from 'viem'
import { mainnet } from 'wagmi/chains'
import { ROUTING } from '@/config/routing'
import { SHAH_CONTRACTS, SHAH_NETWORK } from '@/config/shah-constants'
import { ShahSwapABI } from '@/abi/ShahSwapABI'
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
    const client = getPublicClient()
    const routerAddress =
      (process.env.NEXT_PUBLIC_SHAHSWAP_ROUTER || SHAH_CONTRACTS.ROUTER_V3) as `0x${string}`

    const path = [
      tokenInAddress as `0x${string}`,
      tokenOutAddress as `0x${string}`
    ]

    const amounts = await client.readContract({
      address: routerAddress,
      abi: ShahSwapABI,
      functionName: 'getAmountsOut',
      args: [BigInt(amountIn), path]
    }) as bigint[]

    if (!amounts || amounts.length < 2) {
      return null
    }

    const amountOut = amounts[amounts.length - 1]

    return {
      amountOut: amountOut.toString(),
      priceImpactBps: 0,
      routeLabel: 'ShahSwap',
      hops: path.length - 1,
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

  if (process.env.NEXT_PUBLIC_ENABLE_BALANCER_POOLS === 'false') {
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

let cachedPublicClient: ReturnType<typeof createPublicClient> | null = null

function getPublicClient() {
  if (cachedPublicClient) {
    return cachedPublicClient
  }

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_MAINNET ||
    SHAH_NETWORK.rpcUrl

  cachedPublicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl)
  })

  return cachedPublicClient
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