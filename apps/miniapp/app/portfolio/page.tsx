'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { initializeTelegramWebApp } from '@/lib/telegram'
import PortfolioTotals from '@/components/PortfolioTotals'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react'

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

export default function PortfolioPage() {
  const { address } = useAccount()
  const [initData, setInitData] = useState('')
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d'>('7d')

  useEffect(() => {
    initializeTelegramWebApp()
    const urlParams = new URLSearchParams(window.location.search)
    const tgInitData = urlParams.get('tgWebAppData') || ''
    setInitData(tgInitData)
  }, [])

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

  if (!address) {
    return (
      <div className="mini-app-container">
        <div className="mini-card">
          <div className="text-center text-gray-500">
            Please connect your wallet to view portfolio
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mini-app-container">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Portfolio</h1>
        <p className="text-sm text-gray-600">
          Track your assets, staking, and liquidity positions
        </p>
      </div>

      {/* Portfolio Overview */}
      <div className="mb-6">
        <PortfolioTotals initData={initData} />
      </div>

      {/* Performance Chart */}
      <div className="mini-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Performance</h3>
          </div>
          <div className="flex gap-1">
            {(['1d', '7d', '30d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeframe === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Mock Chart */}
        <div className="h-32 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">Chart coming soon</div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">+12.5%</div>
            <div className="text-xs text-gray-500">Total Return</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">$2,340</div>
            <div className="text-xs text-gray-500">Total Value</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">$156</div>
            <div className="text-xs text-gray-500">Staking Rewards</div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="mini-card mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Asset Allocation</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">E</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">ETH</div>
                <div className="text-xs text-gray-500">Ethereum</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">$1,200</div>
              <div className="text-xs text-gray-500">51.3%</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">SHAH</div>
                <div className="text-xs text-gray-500">SHAH Token</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">$800</div>
              <div className="text-xs text-gray-500">34.2%</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <div className="font-medium text-gray-800">Staked SHAH</div>
                <div className="text-xs text-gray-500">Staking Pool</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-800">$340</div>
              <div className="text-xs text-gray-500">14.5%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mini-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
          <button className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Staking Rewards Claimed</div>
              <div className="text-xs text-gray-500">2 hours ago</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-green-600">+45.2 SHAH</div>
              <div className="text-xs text-gray-500">$0.45</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">SHAH/ETH Swap</div>
              <div className="text-xs text-gray-500">1 day ago</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-blue-600">+0.5 ETH</div>
              <div className="text-xs text-gray-500">-$1,000</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">Staked SHAH</div>
              <div className="text-xs text-gray-500">3 days ago</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-purple-600">+1,000 SHAH</div>
              <div className="text-xs text-gray-500">$10.00</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">LP Position Added</div>
              <div className="text-xs text-gray-500">1 week ago</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-orange-600">+50 LP</div>
              <div className="text-xs text-gray-500">$50.00</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 underline">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  )
} 