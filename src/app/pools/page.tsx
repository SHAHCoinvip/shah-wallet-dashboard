'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { Search, Filter, TrendingUp, Users, DollarSign, Zap } from 'lucide-react'
import { BalancerPool } from '@/lib/balancer'

export default function PoolsPage() {
  const [pools, setPools] = useState<BalancerPool[]>([])
  const [filteredPools, setFilteredPools] = useState<BalancerPool[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'apr'>('tvl')
  const [selectedPool, setSelectedPool] = useState<BalancerPool | null>(null)

  useEffect(() => {
    fetchPools()
  }, [])

  useEffect(() => {
    filterAndSortPools()
  }, [pools, searchTerm, sortBy])

  const fetchPools = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pools?limit=50')
      const data = await response.json()
      setPools(data.pools || [])
    } catch (error) {
      console.error('Failed to fetch pools:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPools = () => {
    let filtered = pools.filter(pool => 
      pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.tokens.some(token => 
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )

    // Sort pools
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tvl':
          return b.totalLiquidity - a.totalLiquidity
        case 'volume':
          return b.volume24h - a.volume24h
        case 'apr':
          return b.apr - a.apr
        default:
          return 0
      }
    })

    setFilteredPools(filtered)
  }

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6 h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Liquidity Pools</h1>
          <p className="text-gray-400">Multi-token pools with advanced AMM features</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search pools or tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'tvl' | 'volume' | 'apr')}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tvl">Sort by TVL</option>
              <option value="volume">Sort by Volume</option>
              <option value="apr">Sort by APR</option>
            </select>
            
            <button className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total TVL</p>
                <p className="text-white text-xl font-semibold">
                  {formatUSD(pools.reduce((sum, pool) => sum + pool.totalLiquidity, 0))}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-white text-xl font-semibold">
                  {formatUSD(pools.reduce((sum, pool) => sum + pool.volume24h, 0))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Pools</p>
                <p className="text-white text-xl font-semibold">{pools.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg APR</p>
                <p className="text-white text-xl font-semibold">
                  {formatPercentage(pools.reduce((sum, pool) => sum + pool.apr, 0) / pools.length)}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>
        </div>

        {/* Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map((pool, index) => (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer"
              onClick={() => setSelectedPool(pool)}
            >
              {/* Pool Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">{pool.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    {pool.tokens.length}-Token Pool
                  </span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    {formatPercentage(pool.apr)} APR
                  </span>
                </div>
              </div>

              {/* Tokens */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Tokens</p>
                <div className="flex flex-wrap gap-2">
                  {pool.tokens.slice(0, 3).map((token) => (
                    <div key={token.id} className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs">
                      <span className="text-white">{token.symbol}</span>
                      <span className="text-gray-400">({formatPercentage(token.weight * 100)})</span>
                    </div>
                  ))}
                  {pool.tokens.length > 3 && (
                    <span className="text-gray-400 text-xs">+{pool.tokens.length - 3} more</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">TVL</span>
                  <span className="text-white">{formatUSD(pool.totalLiquidity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">24h Volume</span>
                  <span className="text-white">{formatUSD(pool.volume24h)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="text-white">{formatPercentage(pool.swapFee * 100)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  Add Liquidity
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors">
                  Swap
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredPools.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No pools found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Pool Detail Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedPool.name}</h2>
                <p className="text-gray-400">Pool ID: {selectedPool.id.slice(0, 8)}...</p>
              </div>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Pool Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Total TVL</p>
                <p className="text-white text-xl font-semibold">{formatUSD(selectedPool.totalLiquidity)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">24h Volume</p>
                <p className="text-white text-xl font-semibold">{formatUSD(selectedPool.volume24h)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">APR</p>
                <p className="text-white text-xl font-semibold">{formatPercentage(selectedPool.apr)}</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Swap Fee</p>
                <p className="text-white text-xl font-semibold">{formatPercentage(selectedPool.swapFee * 100)}</p>
              </div>
            </div>

            {/* Tokens */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Pool Tokens</h3>
              <div className="space-y-3">
                {selectedPool.tokens.map((token) => (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{token.symbol}</p>
                      <p className="text-gray-400 text-sm">{token.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{formatPercentage(token.weight * 100)}</p>
                      <p className="text-gray-400 text-sm">
                        {parseFloat(token.balance).toLocaleString()} {token.symbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Liquidity
              </button>
              <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Swap Tokens
              </button>
              <button className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                View Analytics
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
} 