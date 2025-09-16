export const ROUTING = {
  enableBalancer: true,
  balancerMaxSlippageBps: 100, // 1%
  poolCacheTtlMs: 60_000, // 1 minute cache
  maxPoolsToCheck: 5, // Limit pool discovery for performance
  minLiquidityUsd: 1000, // Minimum pool liquidity to consider
  priceImpactThresholdBps: 500, // 5% max price impact
} as const

export const BALANCER_CONFIG = {
  vault: process.env.NEXT_PUBLIC_BALANCER_VAULT || '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
  subgraph: process.env.NEXT_PUBLIC_BALANCER_SUBGRAPH || 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2',
  poolTypes: ['Weighted', 'ComposableStable', 'Stable'] as const,
} as const

export type PoolType = typeof BALANCER_CONFIG.poolTypes[number] 