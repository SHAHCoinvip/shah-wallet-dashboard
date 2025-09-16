'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useBalance, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { toast } from 'react-hot-toast'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ClockIcon, ChartBarIcon, CurrencyDollarIcon, CogIcon, PlayIcon, PauseIcon, TrashIcon } from '@heroicons/react/24/outline'

interface LimitOrder {
  id: string
  tokenAddress: string
  tokenSymbol: string
  type: 'buy' | 'sell'
  amount: string
  price: string
  total: string
  status: 'pending' | 'filled' | 'cancelled'
  createdAt: number
  expiresAt: number
}

interface DCAStrategy {
  id: string
  name: string
  tokenAddress: string
  tokenSymbol: string
  amount: string
  frequency: 'daily' | 'weekly' | 'monthly'
  duration: number // days
  totalInvested: string
  totalBought: string
  averagePrice: string
  status: 'active' | 'paused' | 'completed'
  nextExecution: number
  createdAt: number
}

interface TradingStats {
  totalTrades: number
  successfulTrades: number
  totalVolume: string
  averageReturn: number
  bestTrade: number
  worstTrade: number
}

export default function AdvancedTrading() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'limit-orders' | 'dca' | 'stats'>('limit-orders')
  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>([])
  const [dcaStrategies, setDcaStrategies] = useState<DCAStrategy[]>([])
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null)
  const [showLimitOrderModal, setShowLimitOrderModal] = useState(false)
  const [showDCAModal, setShowDCAModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form states for limit order
  const [limitOrderForm, setLimitOrderForm] = useState({
    tokenAddress: '',
    tokenSymbol: '',
    type: 'buy' as 'buy' | 'sell',
    amount: '',
    price: '',
    expiresIn: '7' // days
  })

  // Form states for DCA
  const [dcaForm, setDcaForm] = useState({
    name: '',
    tokenAddress: '',
    tokenSymbol: '',
    amount: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    duration: '30' // days
  })

  useEffect(() => {
    if (isConnected && address) {
      loadTradingData()
    }
  }, [address, isConnected])

  const loadTradingData = async () => {
    try {
      setLoading(true)
      
      // Mock data - in production, this would fetch from your backend/API
      const mockLimitOrders: LimitOrder[] = [
        {
          id: '1',
          tokenAddress: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
          tokenSymbol: 'SHAH',
          type: 'buy',
          amount: '1000',
          price: '0.000120',
          total: '0.12',
          status: 'pending',
          createdAt: Date.now() - 86400000, // 1 day ago
          expiresAt: Date.now() + 6 * 24 * 60 * 60 * 1000 // 6 days from now
        },
        {
          id: '2',
          tokenAddress: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
          tokenSymbol: 'SHAH',
          type: 'sell',
          amount: '500',
          price: '0.000150',
          total: '0.075',
          status: 'pending',
          createdAt: Date.now() - 172800000, // 2 days ago
          expiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000 // 5 days from now
        }
      ]

      const mockDCAStrategies: DCAStrategy[] = [
        {
          id: '1',
          name: 'SHAH Weekly DCA',
          tokenAddress: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
          tokenSymbol: 'SHAH',
          amount: '0.01',
          frequency: 'weekly',
          duration: 30,
          totalInvested: '0.04',
          totalBought: '333.33',
          averagePrice: '0.000120',
          status: 'active',
          nextExecution: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
          createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 1 week ago
        }
      ]

      const mockTradingStats: TradingStats = {
        totalTrades: 24,
        successfulTrades: 18,
        totalVolume: '2.45',
        averageReturn: 12.5,
        bestTrade: 45.2,
        worstTrade: -8.7
      }

      setLimitOrders(mockLimitOrders)
      setDcaStrategies(mockDCAStrategies)
      setTradingStats(mockTradingStats)
      
    } catch (error) {
      console.error('Error loading trading data:', error)
      toast.error('Failed to load trading data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLimitOrder = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!limitOrderForm.amount || !limitOrderForm.price || !limitOrderForm.tokenSymbol) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const total = parseFloat(limitOrderForm.amount) * parseFloat(limitOrderForm.price)
      const expiresAt = Date.now() + parseInt(limitOrderForm.expiresIn) * 24 * 60 * 60 * 1000

      const newOrder: LimitOrder = {
        id: Date.now().toString(),
        tokenAddress: limitOrderForm.tokenAddress || '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
        tokenSymbol: limitOrderForm.tokenSymbol,
        type: limitOrderForm.type,
        amount: limitOrderForm.amount,
        price: limitOrderForm.price,
        total: total.toFixed(6),
        status: 'pending',
        createdAt: Date.now(),
        expiresAt
      }

      setLimitOrders(prev => [newOrder, ...prev])
      setShowLimitOrderModal(false)
      setLimitOrderForm({
        tokenAddress: '',
        tokenSymbol: '',
        type: 'buy',
        amount: '',
        price: '',
        expiresIn: '7'
      })

      toast.success('Limit order created successfully!')
    } catch (error) {
      console.error('Error creating limit order:', error)
      toast.error('Failed to create limit order')
    }
  }

  const handleCreateDCA = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet')
      return
    }

    if (!dcaForm.name || !dcaForm.amount || !dcaForm.tokenSymbol) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const nextExecution = Date.now() + getFrequencyInMs(dcaForm.frequency)

      const newDCA: DCAStrategy = {
        id: Date.now().toString(),
        name: dcaForm.name,
        tokenAddress: dcaForm.tokenAddress || '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
        tokenSymbol: dcaForm.tokenSymbol,
        amount: dcaForm.amount,
        frequency: dcaForm.frequency,
        duration: parseInt(dcaForm.duration),
        totalInvested: '0',
        totalBought: '0',
        averagePrice: '0',
        status: 'active',
        nextExecution,
        createdAt: Date.now()
      }

      setDcaStrategies(prev => [newDCA, ...prev])
      setShowDCAModal(false)
      setDcaForm({
        name: '',
        tokenAddress: '',
        tokenSymbol: '',
        amount: '',
        frequency: 'weekly',
        duration: '30'
      })

      toast.success('DCA strategy created successfully!')
    } catch (error) {
      console.error('Error creating DCA strategy:', error)
      toast.error('Failed to create DCA strategy')
    }
  }

  const getFrequencyInMs = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 24 * 60 * 60 * 1000
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      default: return 7 * 24 * 60 * 60 * 1000
    }
  }

  const handleCancelLimitOrder = async (orderId: string) => {
    try {
      setLimitOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' as const } : order
      ))
      toast.success('Limit order cancelled')
    } catch (error) {
      console.error('Error cancelling limit order:', error)
      toast.error('Failed to cancel limit order')
    }
  }

  const handleToggleDCA = async (strategyId: string, action: 'pause' | 'resume') => {
    try {
      setDcaStrategies(prev => prev.map(strategy => 
        strategy.id === strategyId 
          ? { ...strategy, status: action === 'pause' ? 'paused' as const : 'active' as const }
          : strategy
      ))
      toast.success(`DCA strategy ${action}d`)
    } catch (error) {
      console.error('Error toggling DCA strategy:', error)
      toast.error('Failed to update DCA strategy')
    }
  }

  const handleDeleteDCA = async (strategyId: string) => {
    try {
      setDcaStrategies(prev => prev.filter(strategy => strategy.id !== strategyId))
      toast.success('DCA strategy deleted')
    } catch (error) {
      console.error('Error deleting DCA strategy:', error)
      toast.error('Failed to delete DCA strategy')
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  const formatTimeUntil = (timestamp: number) => {
    const now = Date.now()
    const diff = timestamp - now
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diff < 0) return 'Expired'
    if (days > 0) return `in ${days}d ${hours}h`
    if (hours > 0) return `in ${hours}h`
    return 'Soon'
  }

  if (!isConnected) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold mb-4">🚀 Advanced Trading</h3>
        <p className="text-gray-400 mb-6">Connect your wallet to access advanced trading features</p>
        <ConnectButton />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
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
        <h2 className="text-2xl font-bold">🚀 Advanced Trading</h2>
        <div className="flex items-center space-x-2">
          {(['limit-orders', 'dca', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'limit-orders' ? 'Limit Orders' : 
               tab === 'dca' ? 'DCA Strategies' : 'Trading Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Limit Orders Tab */}
      {activeTab === 'limit-orders' && (
        <div className="space-y-6">
          {/* Create Limit Order Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Limit Orders</h3>
            <button
              onClick={() => setShowLimitOrderModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              + Create Limit Order
            </button>
          </div>

          {/* Limit Orders List */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Token</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Expires</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {limitOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="font-medium">{order.tokenSymbol}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.type === 'buy' 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-red-900 text-red-300'
                        }`}>
                          {order.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">{order.amount} {order.tokenSymbol}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">${order.price}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">${order.total}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' 
                            ? 'bg-yellow-900 text-yellow-300'
                            : order.status === 'filled'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-gray-700 text-gray-300'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">{formatTimeUntil(order.expiresAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancelLimitOrder(order.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {limitOrders.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No limit orders yet</p>
                <p className="text-sm mt-2">Create your first limit order to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DCA Strategies Tab */}
      {activeTab === 'dca' && (
        <div className="space-y-6">
          {/* Create DCA Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Dollar Cost Averaging</h3>
            <button
              onClick={() => setShowDCAModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              + Create DCA Strategy
            </button>
          </div>

          {/* DCA Strategies List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dcaStrategies.map((strategy) => (
              <div key={strategy.id} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold">{strategy.name}</h4>
                    <p className="text-sm text-gray-400">{strategy.tokenSymbol}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    strategy.status === 'active' 
                      ? 'bg-green-900 text-green-300'
                      : strategy.status === 'paused'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="font-medium">${strategy.amount} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frequency:</span>
                    <span className="font-medium capitalize">{strategy.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Invested:</span>
                    <span className="font-medium">${strategy.totalInvested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Bought:</span>
                    <span className="font-medium">{strategy.totalBought} {strategy.tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Price:</span>
                    <span className="font-medium">${strategy.averagePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next Execution:</span>
                    <span className="font-medium">{formatTimeUntil(strategy.nextExecution)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {strategy.status === 'active' ? (
                    <button
                      onClick={() => handleToggleDCA(strategy.id, 'pause')}
                      className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      <PauseIcon className="w-4 h-4" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleDCA(strategy.id, 'resume')}
                      className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteDCA(strategy.id)}
                    className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {dcaStrategies.length === 0 && (
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8 text-center">
              <ChartBarIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No DCA strategies yet</p>
              <p className="text-sm text-gray-500 mt-2">Create your first DCA strategy to automate your investments</p>
            </div>
          )}
        </div>
      )}

      {/* Trading Stats Tab */}
      {activeTab === 'stats' && tradingStats && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold">Trading Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-sm text-gray-400 mb-2">Total Trades</h4>
              <p className="text-2xl font-bold">{tradingStats.totalTrades}</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-sm text-gray-400 mb-2">Success Rate</h4>
              <p className="text-2xl font-bold text-green-400">
                {((tradingStats.successfulTrades / tradingStats.totalTrades) * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-sm text-gray-400 mb-2">Total Volume</h4>
              <p className="text-2xl font-bold">${tradingStats.totalVolume} ETH</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-sm text-gray-400 mb-2">Avg Return</h4>
              <p className={`text-2xl font-bold ${tradingStats.averageReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tradingStats.averageReturn >= 0 ? '+' : ''}{tradingStats.averageReturn.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4">Best Trade</h4>
              <p className="text-3xl font-bold text-green-400">+{tradingStats.bestTrade.toFixed(1)}%</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h4 className="text-lg font-bold mb-4">Worst Trade</h4>
              <p className="text-3xl font-bold text-red-400">{tradingStats.worstTrade.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Limit Order Modal */}
      {showLimitOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold mb-4">Create Limit Order</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token Symbol</label>
                <input
                  type="text"
                  value={limitOrderForm.tokenSymbol}
                  onChange={(e) => setLimitOrderForm(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
                  placeholder="SHAH"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Order Type</label>
                <select
                  value={limitOrderForm.type}
                  onChange={(e) => setLimitOrderForm(prev => ({ ...prev, type: e.target.value as 'buy' | 'sell' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={limitOrderForm.amount}
                  onChange={(e) => setLimitOrderForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="1000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Price (USD)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={limitOrderForm.price}
                  onChange={(e) => setLimitOrderForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.000120"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Expires In (Days)</label>
                <select
                  value={limitOrderForm.expiresIn}
                  onChange={(e) => setLimitOrderForm(prev => ({ ...prev, expiresIn: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateLimitOrder}
                className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
              >
                Create Order
              </button>
              <button
                onClick={() => setShowLimitOrderModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DCA Modal */}
      {showDCAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-bold mb-4">Create DCA Strategy</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Strategy Name</label>
                <input
                  type="text"
                  value={dcaForm.name}
                  onChange={(e) => setDcaForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="SHAH Weekly DCA"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Token Symbol</label>
                <input
                  type="text"
                  value={dcaForm.tokenSymbol}
                  onChange={(e) => setDcaForm(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase() }))}
                  placeholder="SHAH"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={dcaForm.amount}
                  onChange={(e) => setDcaForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.01"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <select
                  value={dcaForm.frequency}
                  onChange={(e) => setDcaForm(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Duration (Days)</label>
                <select
                  value={dcaForm.duration}
                  onChange={(e) => setDcaForm(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateDCA}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                Create Strategy
              </button>
              <button
                onClick={() => setShowDCAModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
} 