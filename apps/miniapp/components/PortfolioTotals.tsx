'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Coins, Lock, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'

interface PortfolioData {
  wallet: string
  totalUsd: number
  balances: {
    ETH: {
      balance: string
      balanceUsd: number
      symbol: string
      decimals: number
    }
    SHAH: {
      balance: string
      balanceUsd: number
      symbol: string
      decimals: number
    }
  }
  staking: {
    stakedAmount: string
    stakedUsd: number
    pendingRewards: string
    pendingRewardsUsd: number
    currentTier: number
    tierInfo: {
      name: string
      apy: number
      minStake: number
    }
    apy: number
  }
  lpPositions: Array<{
    pool: string
    pair: string
    balance: string
    share: number
    valueUsd: number
    tokens: Array<{
      symbol: string
      balance: string
    }>
  }>
  lastUpdated: string
}

interface PortfolioTotalsProps {
  initData: string
}

export default function PortfolioTotals({ initData }: PortfolioTotalsProps) {
  const { address } = useAccount()
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (address) {
      fetchPortfolio()
    }
  }, [address, initData])

  const fetchPortfolio = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/portfolio?wallet=${address}&initData=${encodeURIComponent(initData)}`)
      const data = await response.json()

      if (data.success) {
        setPortfolio(data.portfolio)
      } else {
        setError(data.error || 'Failed to fetch portfolio')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error fetching portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatTokenAmount = (amount: string, decimals: number) => {
    const num = Number(amount) / Math.pow(10, decimals)
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    })
  }

  if (loading) {
    return (
      <div className="mini-card animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-300 rounded"></div>
          <div className="h-16 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mini-card border-red-200 bg-red-50">
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={fetchPortfolio}
          className="mt-2 text-xs text-red-600 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="mini-card">
        <div className="text-center text-gray-500">
          No portfolio data available
        </div>
      </div>
    )
  }

  const { balances, staking, lpPositions, totalUsd } = portfolio
  const lpTotalUsd = lpPositions.reduce((sum, pos) => sum + pos.valueUsd, 0)

  return (
    <div className="mini-card">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold text-gray-800">Portfolio Overview</h3>
      </div>

      {/* Total Value */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(totalUsd)}
          </div>
          <div className="text-sm text-gray-600">Total Portfolio Value</div>
        </div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-blue-500" />
            <div className="text-xs text-gray-600">ETH Balance</div>
          </div>
          <div className="text-lg font-semibold text-blue-600">
            {formatTokenAmount(balances.ETH.balance, balances.ETH.decimals)}
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(balances.ETH.balanceUsd)}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <div className="text-xs text-gray-600">SHAH Balance</div>
          </div>
          <div className="text-lg font-semibold text-yellow-600">
            {formatTokenAmount(balances.SHAH.balance, balances.SHAH.decimals)}
          </div>
          <div className="text-xs text-gray-500">
            {formatCurrency(balances.SHAH.balanceUsd)}
          </div>
        </div>
      </div>

      {/* Staking */}
      <div className="bg-purple-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-purple-500" />
          <div className="text-sm font-semibold text-gray-800">Staking</div>
          <div className="ml-auto text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded">
            {staking.tierInfo.name}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-600">Staked</div>
            <div className="font-semibold text-purple-600">
              {formatTokenAmount(staking.stakedAmount, 18)} SHAH
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(staking.stakedUsd)}
            </div>
          </div>
          
          <div>
            <div className="text-gray-600">Rewards</div>
            <div className="font-semibold text-green-600">
              {formatTokenAmount(staking.pendingRewards, 18)} SHAH
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(staking.pendingRewardsUsd)}
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          APY: <span className="font-semibold text-purple-600">{staking.apy}%</span>
        </div>
      </div>

      {/* LP Positions */}
      {lpPositions.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <div className="text-sm font-semibold text-gray-800">Liquidity Pools</div>
          </div>
          
          <div className="space-y-2">
            {lpPositions.map((position, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div>
                  <div className="font-medium text-gray-800">{position.pool}</div>
                  <div className="text-xs text-gray-500">
                    {(position.share * 100).toFixed(2)}% share
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(position.valueUsd)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTokenAmount(position.balance, 18)} LP
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-gray-600">
            Total LP Value: <span className="font-semibold text-orange-600">
              {formatCurrency(lpTotalUsd)}
            </span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        Last updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  )
} 