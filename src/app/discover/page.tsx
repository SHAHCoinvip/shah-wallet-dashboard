'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { 
  Search, 
  TrendingUp, 
  Sparkles, 
  Shield, 
  Star,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  Share2
} from 'lucide-react'
import VerifiedBadge from '@/components/VerifiedBadge'
import ChartEmbed from '@/components/ChartEmbed'

interface Token {
  id: string
  name: string
  symbol: string
  address: string
  networkId: number
  networkName: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  totalSupply: string
  holders: number
  isVerified: boolean
  isTrending: boolean
  isNew: boolean
  createdAt: string
  description: string
  website?: string
  telegram?: string
  twitter?: string
  tags: string[]
}

interface DiscoveryFilters {
  category: 'all' | 'trending' | 'new' | 'verified'
  network: 'all' | '1' | '137' | '56' | '42161' | '10'
  sortBy: 'price' | 'change24h' | 'volume24h' | 'marketCap' | 'holders' | 'createdAt'
  sortOrder: 'asc' | 'desc'
  search: string
}

export default function DiscoverPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DiscoveryFilters>({
    category: 'all',
    network: 'all',
    sortBy: 'volume24h',
    sortOrder: 'desc',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tokens, filters])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      // Mock data - in production, this would fetch from APIs
      const mockTokens: Token[] = [
        {
          id: '1',
          name: 'SHAH Token',
          symbol: 'SHAH',
          address: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
          networkId: 1,
          networkName: 'Ethereum',
          price: 0.01,
          change24h: 15.5,
          volume24h: 2500000,
          marketCap: 10000000,
          totalSupply: '1000000000000000000000000000',
          holders: 12500,
          isVerified: true,
          isTrending: true,
          isNew: false,
          createdAt: '2024-01-01T00:00:00Z',
          description: 'The native token of the SHAH ecosystem',
          website: 'https://shah.vip',
          telegram: 'https://t.me/shahcoin',
          twitter: 'https://twitter.com/shahcoin',
          tags: ['defi', 'staking', 'governance']
        },
        {
          id: '2',
          name: 'MemeCoin Alpha',
          symbol: 'MEME',
          address: '0x1234567890123456789012345678901234567890',
          networkId: 1,
          networkName: 'Ethereum',
          price: 0.0001,
          change24h: 45.2,
          volume24h: 1800000,
          marketCap: 5000000,
          totalSupply: '10000000000000000000000000000',
          holders: 8500,
          isVerified: false,
          isTrending: true,
          isNew: true,
          createdAt: '2024-01-20T00:00:00Z',
          description: 'The next big meme coin',
          tags: ['meme', 'viral']
        },
        {
          id: '3',
          name: 'DeFi Protocol Token',
          symbol: 'DEFI',
          address: '0xabcdef1234567890abcdef1234567890abcdef12',
          networkId: 137,
          networkName: 'Polygon',
          price: 2.5,
          change24h: -5.2,
          volume24h: 800000,
          marketCap: 25000000,
          totalSupply: '10000000000000000000000000',
          holders: 3200,
          isVerified: true,
          isTrending: false,
          isNew: false,
          createdAt: '2023-12-01T00:00:00Z',
          description: 'Decentralized finance protocol token',
          website: 'https://defiprotocol.com',
          tags: ['defi', 'yield', 'lending']
        }
      ]

      setTokens(mockTokens)
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tokens]

    // Category filter
    if (filters.category !== 'all') {
      switch (filters.category) {
        case 'trending':
          filtered = filtered.filter(token => token.isTrending)
          break
        case 'new':
          filtered = filtered.filter(token => token.isNew)
          break
        case 'verified':
          filtered = filtered.filter(token => token.isVerified)
          break
      }
    }

    // Network filter
    if (filters.network !== 'all') {
      filtered = filtered.filter(token => token.networkId.toString() === filters.network)
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchLower) ||
        token.symbol.toLowerCase().includes(searchLower) ||
        token.description.toLowerCase().includes(searchLower) ||
        token.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'change24h':
          aValue = a.change24h
          bValue = b.change24h
          break
        case 'volume24h':
          aValue = a.volume24h
          bValue = b.volume24h
          break
        case 'marketCap':
          aValue = a.marketCap
          bValue = b.marketCap
          break
        case 'holders':
          aValue = a.holders
          bValue = b.holders
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a.volume24h
          bValue = b.volume24h
      }

      if (filters.sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })

    setFilteredTokens(filtered)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const toggleFavorite = (tokenId: string) => {
    setFavorites(prev => 
      prev.includes(tokenId) 
        ? prev.filter(id => id !== tokenId)
        : [...prev, tokenId]
    )
  }

  const shareToken = (token: Token) => {
    const url = `${window.location.origin}/discover?token=${token.address}`
    if (navigator.share) {
      navigator.share({
        title: `${token.name} (${token.symbol})`,
        text: `Check out ${token.name} on SHAH Wallet Discovery!`,
        url
      })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  const getCategoryStats = () => {
    const total = tokens.length
    const trending = tokens.filter(t => t.isTrending).length
    const newTokens = tokens.filter(t => t.isNew).length
    const verified = tokens.filter(t => t.isVerified).length

    return { total, trending, newTokens, verified }
  }

  const stats = getCategoryStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Discover Tokens</h1>
          <p className="text-gray-600">Find trending, new, and verified tokens across multiple networks</p>
        </div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tokens</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.trending}</div>
                <div className="text-sm text-gray-600">Trending</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.newTokens}</div>
                <div className="text-sm text-gray-600">New Today</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats.verified}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens by name, symbol, or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="trending">Trending</option>
                    <option value="new">New</option>
                    <option value="verified">Verified</option>
                  </select>
                </div>

                {/* Network */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                  <select
                    value={filters.network}
                    onChange={(e) => setFilters(prev => ({ ...prev, network: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Networks</option>
                    <option value="1">Ethereum</option>
                    <option value="137">Polygon</option>
                    <option value="56">BSC</option>
                    <option value="42161">Arbitrum</option>
                    <option value="10">Optimism</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="volume24h">Volume 24h</option>
                    <option value="change24h">Change 24h</option>
                    <option value="marketCap">Market Cap</option>
                    <option value="price">Price</option>
                    <option value="holders">Holders</option>
                    <option value="createdAt">Created Date</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTokens.map((token, index) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Token Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{token.name}</h3>
                        {token.isVerified && <VerifiedBadge />}
                      </div>
                      <div className="text-sm text-gray-500">{token.symbol}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(token.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        favorites.includes(token.id)
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(token.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => shareToken(token)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                  {token.isTrending && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trending
                    </span>
                  )}
                  {token.isNew && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Sparkles className="w-3 h-3 mr-1" />
                      New
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {token.networkName}
                  </span>
                </div>

                {/* Price and Change */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-800">
                    ${token.price.toFixed(6)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {token.change24h >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Token Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Volume 24h</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(token.volume24h)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Market Cap</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(token.marketCap)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Holders</div>
                    <div className="font-semibold text-gray-800">{formatNumber(token.holders)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Network</div>
                    <div className="font-semibold text-gray-800">{token.networkName}</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="text-sm text-gray-600 line-clamp-2">{token.description}</div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {token.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    Trade
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {filteredTokens.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tokens found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}

        {/* Results Count */}
        {filteredTokens.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredTokens.length} of {tokens.length} tokens
          </div>
        )}
      </div>
    </div>
  )
} 