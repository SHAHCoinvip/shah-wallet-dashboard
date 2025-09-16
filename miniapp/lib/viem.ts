import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { mainnet } from 'viem/chains'

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_RPC_MAINNET),
})

// Wallet client for transactions (used with RainbowKit)
export const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
})

// Contract addresses - Updated for DEX V3
export const CONTRACTS = {
  SHAH: process.env.NEXT_PUBLIC_SHAH as `0x${string}`,
  SHAHSWAP: process.env.NEXT_PUBLIC_SHAHSWAP as `0x${string}`,
  STAKING: process.env.NEXT_PUBLIC_STAKING as `0x${string}`,
  SHAH_FACTORY: process.env.NEXT_PUBLIC_SHAH_FACTORY as `0x${string}`,
  SHAH_REGISTRY: process.env.NEXT_PUBLIC_SHAH_REGISTRY as `0x${string}`,
  SHAH_PRICE_ORACLE: process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE as `0x${string}`,
  // DEX V3 Contracts
  SHAHSWAP_FACTORY_V3: '0xcE9A12D1151E6776c2da10126997c47c85Cedd48' as `0x${string}`,
  SHAHSWAP_ROUTER_V3: '0x791c34Df045071eB9896DAfA57e3db46CBEBA11b' as `0x${string}`,
  // DEX V3 Pairs
  SHAH_USDT_PAIR: '0x85F618962C57E0420128388b45Fae9a9C5f989d0' as `0x${string}`,
  SHAH_WETH_PAIR: '0x35582bc7582a5E4950f8A239709dcc1356719ca0' as `0x${string}`,
  SHAH_DAI_PAIR: '0x3948CfA4f3d2d637D' as `0x${string}`,
} as const

// Token ABIs (minimal versions for Mini-App)
export const SHAH_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const SHAHSWAP_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const STAKING_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'pendingRewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'currentTier',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'unstake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Utility functions
export async function getSHAHBalance(address: `0x${string}`) {
  try {
    const balance = await publicClient.readContract({
      address: CONTRACTS.SHAH,
      abi: SHAH_ABI,
      functionName: 'balanceOf',
      args: [address],
    })
    return balance
  } catch (error) {
    console.error('Error getting SHAH balance:', error)
    return 0n
  }
}

export async function getStakingInfo(address: `0x${string}`) {
  try {
    const [stakedBalance, pendingRewards, currentTier] = await Promise.all([
      publicClient.readContract({
        address: CONTRACTS.STAKING,
        abi: STAKING_ABI,
        functionName: 'balanceOf',
        args: [address],
      }),
      publicClient.readContract({
        address: CONTRACTS.STAKING,
        abi: STAKING_ABI,
        functionName: 'pendingRewards',
        args: [address],
      }),
      publicClient.readContract({
        address: CONTRACTS.STAKING,
        abi: STAKING_ABI,
        functionName: 'currentTier',
        args: [address],
      }),
    ])

    return {
      stakedBalance,
      pendingRewards,
      currentTier: Number(currentTier),
    }
  } catch (error) {
    console.error('Error getting staking info:', error)
    return {
      stakedBalance: 0n,
      pendingRewards: 0n,
      currentTier: 0,
    }
  }
}

export async function getSwapEstimate(
  amountIn: bigint,
  path: `0x${string}`[]
) {
  try {
    const amounts = await publicClient.readContract({
      address: CONTRACTS.SHAHSWAP,
      abi: SHAHSWAP_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, path],
    })
    return amounts
  } catch (error) {
    console.error('Error getting swap estimate:', error)
    return [0n, 0n]
  }
} 