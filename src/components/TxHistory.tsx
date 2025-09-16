'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { 
  getTransactionHistory, 
  ProcessedTransaction, 
  formatAddress, 
  formatTimeAgo, 
  getEtherscanUrl 
} from '@/lib/etherscan'

interface TxHistoryProps {
  limit?: number
  className?: string
  showHeader?: boolean
}

export default function TxHistory({ limit = 10, className = '', showHeader = true }: TxHistoryProps) {
  const { address, isConnected } = useAccount()
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions()
    }
  }, [address, isConnected])

  const fetchTransactions = async () => {
    if (!address) return
    
    try {
      setLoading(true)
      setError(null)
      const txs = await getTransactionHistory(address, limit)
      setTransactions(txs)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (tx: ProcessedTransaction) => {
    if (tx.type === 'token') {
      return tx.from.toLowerCase() === address?.toLowerCase() ? '📤' : '📥'
    }
    return tx.from.toLowerCase() === address?.toLowerCase() ? '⬆️' : '⬇️'
  }

  const getTransactionColor = (tx: ProcessedTransaction) => {
    if (tx.status === 'failed') return 'text-red-400'
    return tx.from.toLowerCase() === address?.toLowerCase() ? 'text-red-400' : 'text-green-400'
  }

  const getValueDisplay = (tx: ProcessedTransaction) => {
    const value = parseFloat(tx.value)
    if (value === 0) return '0'
    if (value < 0.001) return '<0.001'
    return value.toFixed(6)
  }

  if (!isConnected) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-4">🔌</div>
          <p>Connect your wallet to view transaction history</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900 rounded-xl overflow-hidden ${className}`}
    >
      {showHeader && (
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Recent Transactions</h3>
              <p className="text-gray-400 text-sm">Latest activity from Etherscan</p>
            </div>
            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {loading && transactions.length === 0 ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-400 text-sm">
              {process.env.NEXT_PUBLIC_ETHERSCAN_KEY ? 
                'API rate limit may have been exceeded' : 
                'Add ETHERSCAN_KEY to environment variables for better performance'
              }
            </p>
            <button
              onClick={fetchTransactions}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <div className="text-4xl mb-4">📜</div>
            <p>No recent transactions found</p>
            <p className="text-sm mt-2">Transactions will appear here as you use your wallet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.hash}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Transaction Icon & Status */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      tx.status === 'failed' 
                        ? 'bg-red-900 text-red-300' 
                        : 'bg-gray-700 text-white'
                    }`}>
                      {tx.status === 'failed' ? '❌' : getTransactionIcon(tx)}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white">
                        {tx.method || (tx.type === 'token' ? 'Token Transfer' : 'ETH Transfer')}
                      </span>
                      {tx.status === 'failed' && (
                        <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                          Failed
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{formatAddress(tx.from)} → {formatAddress(tx.to)}</span>
                      <span>{formatTimeAgo(tx.timestamp)}</span>
                    </div>
                    
                    {tx.type === 'token' && tx.tokenSymbol && (
                      <div className="text-xs text-purple-400 mt-1">
                        {tx.tokenName} ({tx.tokenSymbol})
                      </div>
                    )}
                  </div>

                  {/* Value & Link */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`font-medium ${getTransactionColor(tx)}`}>
                      {tx.from.toLowerCase() === address?.toLowerCase() ? '-' : '+'}
                      {getValueDisplay(tx)} {tx.type === 'token' ? tx.tokenSymbol : 'ETH'}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <a
                        href={getEtherscanUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        📊 View
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="p-4 border-t border-gray-700 text-center">
          <a
            href={`https://etherscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all transactions on Etherscan →
          </a>
        </div>
      )}
    </motion.div>
  )
}