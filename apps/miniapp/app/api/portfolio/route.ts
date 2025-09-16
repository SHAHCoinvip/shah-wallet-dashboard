import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/telegram'
import { publicClient } from '@/lib/viem'

// Staking contract ABI (minimal)
const STAKING_ABI = [
  {
    inputs: [{ type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ type: 'address' }],
    name: 'pendingRewards',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ type: 'address' }],
    name: 'getCurrentTier',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// SHAH token ABI (minimal)
const SHAH_ABI = [
  {
    inputs: [{ type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')
    const initData = searchParams.get('initData')

    if (!wallet || !initData) {
      return NextResponse.json({ error: 'Missing wallet or initData' }, { status: 400 })
    }

    // Validate Telegram initData
    const validation = await validateInitData(initData)
    if (!validation.ok) {
      return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
    }

    // Validate wallet address
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const walletAddress = wallet as `0x${string}`

    // Fetch balances and staking info using multicall
    const [ethBalance, shahBalance, stakedAmount, pendingRewards, currentTier] = await Promise.all([
      publicClient.getBalance({ address: walletAddress }),
      publicClient.readContract({
        address: process.env.NEXT_PUBLIC_SHAH as `0x${string}`,
        abi: SHAH_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      }),
      publicClient.readContract({
        address: process.env.NEXT_PUBLIC_STAKING as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      }),
      publicClient.readContract({
        address: process.env.NEXT_PUBLIC_STAKING as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'pendingRewards',
        args: [walletAddress]
      }),
      publicClient.readContract({
        address: process.env.NEXT_PUBLIC_STAKING as `0x${string}`,
        abi: STAKING_ABI,
        functionName: 'getCurrentTier',
        args: [walletAddress]
      })
    ])

    // Calculate tier info
    const tierInfo = getTierInfo(Number(currentTier))
    
    // Mock LP positions (replace with actual Uniswap V2/V3 queries)
    const lpPositions = await getMockLPPositions(walletAddress)

    // Calculate USD totals (using mock prices for now)
    const ethPriceUsd = 2000 // Mock ETH price
    const shahPriceUsd = 0.01 // Mock SHAH price
    
    const ethBalanceUsd = Number(ethBalance) / 1e18 * ethPriceUsd
    const shahBalanceUsd = Number(shahBalance) / 1e18 * shahPriceUsd
    const stakedUsd = Number(stakedAmount) / 1e18 * shahPriceUsd
    const pendingRewardsUsd = Number(pendingRewards) / 1e18 * shahPriceUsd
    const lpTotalUsd = lpPositions.reduce((sum, pos) => sum + pos.valueUsd, 0)

    const totalUsd = ethBalanceUsd + shahBalanceUsd + stakedUsd + lpTotalUsd

    return NextResponse.json({
      success: true,
      portfolio: {
        wallet: walletAddress,
        totalUsd,
        balances: {
          ETH: {
            balance: ethBalance.toString(),
            balanceUsd: ethBalanceUsd,
            symbol: 'ETH',
            decimals: 18
          },
          SHAH: {
            balance: shahBalance.toString(),
            balanceUsd: shahBalanceUsd,
            symbol: 'SHAH',
            decimals: 18
          }
        },
        staking: {
          stakedAmount: stakedAmount.toString(),
          stakedUsd,
          pendingRewards: pendingRewards.toString(),
          pendingRewardsUsd,
          currentTier: Number(currentTier),
          tierInfo,
          apy: tierInfo.apy
        },
        lpPositions,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in portfolio API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getTierInfo(tier: number) {
  const tiers = {
    0: { name: 'No Tier', apy: 0, minStake: 0 },
    1: { name: 'Bronze', apy: 10, minStake: 100 },
    2: { name: 'Silver', apy: 15, minStake: 1000 },
    3: { name: 'Gold', apy: 20, minStake: 5000 }
  }
  return tiers[tier as keyof typeof tiers] || tiers[0]
}

async function getMockLPPositions(walletAddress: `0x${string}`) {
  // Mock LP positions - replace with actual Uniswap queries
  return [
    {
      pool: 'SHAH/ETH',
      pair: '0x1234567890123456789012345678901234567890',
      balance: '1000000000000000000', // 1 LP token
      share: 0.001, // 0.1%
      valueUsd: 50,
      tokens: [
        { symbol: 'SHAH', balance: '1000000000000000000000' }, // 1000 SHAH
        { symbol: 'ETH', balance: '1000000000000000000' } // 1 ETH
      ]
    }
  ]
} 