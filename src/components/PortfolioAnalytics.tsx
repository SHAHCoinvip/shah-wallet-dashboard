'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts'
import { useAccount } from 'wagmi'
import { formatEther, formatUnits } from 'viem'
import { toast } from 'react-hot-toast'

interface PortfolioData {
  timestamp: number
  totalValue: number
  change24h: number
  change7d: number
  change30d: number
  pnl: number
  pnlPercentage: number
}

interface TokenPerformance {
  symbol: string
  name: string
  address: string
  balance: string
  price: number
  value: number
  change24h: number
  allocation: number
  pnl: number
  pnlPercentage: number
}

interface PortfolioMetrics {
  totalValue: number
  totalPnL: number
  totalPnLPercentage: number
  bestPerformer: TokenPerformance | null
  worstPerformer: TokenPerformance | null
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
}

export default function PortfolioAnalytics() {
  const { address, isConnected } = useAccount()
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([])
  const [tokenPerformance, setTokenPerformance] = useState<TokenPerformance[]>([])
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null)
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '1Y'>('7D')
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'value' | 'pnl' | 'allocation'>('value')

  useEffect(() => {
    if (isConnected && address) {
      loadPortfolioData()
    }
  }, [address, isConnected, timeframe])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)
      
      // Mock data - in production, this would fetch from your backend/API
      const mockPortfolioData = generateMockPortfolioData()
      const mockTokenPerformance = generateMockTokenPerformance()
      const mockMetrics = calculateMetrics(mockPortfolioData, mockTokenPerformance)
      
      setPortfolioData(mockPortfolioData)
      setTokenPerformance(mockTokenPerformance)
      setMetrics(mockMetrics)
      
    } catch (error) {
      console.error('Error loading portfolio data:', error)
      toast.error('Failed to load portfolio data')
    } finally {
      setLoading(false)
    }
  }

  const generateMockPortfolioData = (): PortfolioData[] => {
    const now = Date.now()
    const data: PortfolioData[] = []
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000)
      const baseValue = 15000 + Math.sin(i * 0.1) * 2000 + Math.random() * 1000
      const pnl = (baseValue - 15000) * (Math.random() > 0.5 ? 1 : -1)
      
      data.push({
        timestamp,
        totalValue: baseValue,
        change24h: Math.random() * 10 - 5,
        change7d: Math.random() * 20 - 10,
        change30d: Math.random() * 40 - 20,
        pnl,
        pnlPercentage: (pnl / 15000) * 100
      })
    }
    
    return data
  }

  const generateMockTokenPerformance = (): TokenPerformance[] => {
    return [
      {
        symbol: 'SHAH',
        name: 'SHAH Coin',
        address: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
        balance: '10000',
        price: 0.000123,
        value: 1230,
        change24h: 5.2,
        allocation: 45,
        pnl: 120,
        pnlPercentage: 10.8
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        balance: '2.5',
        price: 3200,
        value: 8000,
        change24h: -2.1,
        allocation: 30,
        pnl: -200,
        pnlPercentage: -2.4
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
        balance: '2000',
        price: 1,
        value: 2000,
        change24h: 0.1,
        allocation: 15,
        pnl: 2,
        pnlPercentage: 0.1
      },
      {
        symbol: 'MATIC',
        name: 'Polygon',
        address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608aCafEBB0',
        balance: '500',
        price: 0.8,
        value: 400,
        change24h: 8.5,
        allocation: 10,
        pnl: 50,
        pnlPercentage: 14.3
      }
    ]
  }

  const calculateMetrics = (portfolioData: PortfolioData[], tokens: TokenPerformance[]): PortfolioMetrics => {
    const totalValue = tokens.reduce((sum, token) => sum + token.value, 0)
    const totalPnL = tokens.reduce((sum, token) => sum + token.pnl, 0)
    const totalPnLPercentage = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0
    
    const bestPerformer = tokens.reduce((best, current) => 
      current.pnlPercentage > best.pnlPercentage ? current : best
    )
    
    const worstPerformer = tokens.reduce((worst, current) => 
      current.pnlPercentage < worst.pnlPercentage ? current : worst
    )
    
    // Calculate volatility (standard deviation of returns)
    const returns = portfolioData.slice(1).map((point, i) => {
      const prevValue = portfolioData[i].totalValue
      return ((point.totalValue - prevValue) / prevValue) * 100
    })
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    const volatility = Math.sqrt(variance)
    
    // Mock Sharpe ratio (risk-free rate = 2%)
    const sharpeRatio = volatility > 0 ? (avgReturn - 2) / volatility : 0
    
    // Calculate max drawdown
    let maxDrawdown = 0
    let peak = portfolioData[0].totalValue
    
    portfolioData.forEach(point => {
      if (point.totalValue > peak) {
        peak = point.totalValue
      }
      const drawdown = (peak - point.totalValue) / peak * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })
    
    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      bestPerformer,
      worstPerformer,
      volatility,
      sharpeRatio,
      maxDrawdown
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getColorForChange = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400'
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold mb-4">📊 Portfolio Analytics</h3>
        <p className="text-gray-400">Connect your wallet to view portfolio analytics</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📊 Portfolio Analytics</h2>
        <div className="flex items-center space-x-2">
          {(['1D', '7D', '30D', '1Y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total Value</h3>
          <p className="text-2xl font-bold">{formatCurrency(metrics?.totalValue || 0)}</p>
          <p className={`text-sm ${getColorForChange(metrics?.totalPnLPercentage || 0)}`}>
            {formatPercentage(metrics?.totalPnLPercentage || 0)}
          </p>
        </div>
        
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total P&L</h3>
          <p className={`text-2xl font-bold ${getColorForChange(metrics?.totalPnL || 0)}`}>
            {formatCurrency(metrics?.totalPnL || 0)}
          </p>
          <p className="text-sm text-gray-400">All time</p>
        </div>
        
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm text-gray-400 mb-1">Volatility</h3>
          <p className="text-2xl font-bold">{metrics?.volatility.toFixed(2) || 0}%</p>
          <p className="text-sm text-gray-400">30-day</p>
        </div>
        
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm text-gray-400 mb-1">Sharpe Ratio</h3>
          <p className="text-2xl font-bold">{metrics?.sharpeRatio.toFixed(2) || 0}</p>
          <p className="text-sm text-gray-400">Risk-adjusted</p>
        </div>
      </div>

      {/* Portfolio Chart */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Portfolio Performance</h3>
          <div className="flex items-center space-x-2">
            {(['value', 'pnl', 'allocation'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedMetric === metric
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === 'value' ? (
              <AreaChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatCurrency(value), 'Portfolio Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalValue" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : selectedMetric === 'pnl' ? (
              <LineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#9CA3AF"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatCurrency(value), 'P&L']}
                />
                <Line 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={tokenPerformance}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="allocation"
                  label={({ symbol, allocation }) => `${symbol} ${allocation.toFixed(1)}%`}
                >
                  {tokenPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  formatter={(value: any, name: any) => [value.toFixed(1) + '%', name]}
                />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token Performance Table */}
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold">Token Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Token</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Balance</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Value</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">24h Change</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">P&L</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tokenPerformance.map((token, index) => (
                <tr key={token.address} className="hover:bg-gray-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{token.symbol}</div>
                        <div className="text-sm text-gray-400">{token.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {parseFloat(token.balance).toLocaleString()} {token.symbol}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{formatCurrency(token.value)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getColorForChange(token.change24h)}`}>
                      {formatPercentage(token.change24h)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className={`font-medium ${getColorForChange(token.pnl)}`}>
                        {formatCurrency(token.pnl)}
                      </div>
                      <div className={`text-xs ${getColorForChange(token.pnlPercentage)}`}>
                        {formatPercentage(token.pnlPercentage)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">{token.allocation.toFixed(1)}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Max Drawdown</span>
              <span className="text-red-400 font-medium">{metrics?.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Best Performer</span>
              <div className="text-right">
                <div className="text-green-400 font-medium">{metrics?.bestPerformer?.symbol}</div>
                <div className="text-sm text-gray-400">{formatPercentage(metrics?.bestPerformer?.pnlPercentage || 0)}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Worst Performer</span>
              <div className="text-right">
                <div className="text-red-400 font-medium">{metrics?.worstPerformer?.symbol}</div>
                <div className="text-sm text-gray-400">{formatPercentage(metrics?.worstPerformer?.pnlPercentage || 0)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Risk Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Volatility (30d)</span>
              <span className="font-medium">{metrics?.volatility.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Sharpe Ratio</span>
              <span className={`font-medium ${(metrics?.sharpeRatio || 0) > 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                {metrics?.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Risk Level</span>
              <span className={`font-medium ${
                (metrics?.volatility || 0) < 10 ? 'text-green-400' : 
                (metrics?.volatility || 0) < 20 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {(metrics?.volatility || 0) < 10 ? 'Low' : 
                 (metrics?.volatility || 0) < 20 ? 'Medium' : 'High'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 