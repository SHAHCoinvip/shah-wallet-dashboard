'use client'

import { motion } from 'framer-motion'
import { TokenCreated } from '@/lib/admin'
import VerifiedBadge from './VerifiedBadge'

interface AdminTableProps {
  tokens: TokenCreated[]
  loading: boolean
}

export default function AdminTable({ tokens, loading }: AdminTableProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Recent Token Creations</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-xl font-bold">Recent Token Creations</h3>
        <p className="text-gray-400 text-sm mt-1">Latest tokens created via SHAH Factory</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Token</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Creator</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Created</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {tokens.map((token, index) => (
              <motion.tr
                key={token.tokenAddress}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="hover:bg-gray-700/30"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{token.name}</div>
                      <div className="text-sm text-gray-400">{token.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-700 px-2 py-1 rounded">
                      {formatAddress(token.creator)}
                    </code>
                    <a
                      href={`https://etherscan.io/address/${token.creator}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      📊
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {formatTimeAgo(token.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Block {token.blockNumber.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <VerifiedBadge 
                    tokenAddress={token.tokenAddress as `0x${string}`}
                    className="text-xs"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://etherscan.io/token/${token.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      View
                    </a>
                    <a
                      href={`/admin/verify?token=${token.tokenAddress}`}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      Verify
                    </a>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tokens.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <div className="text-4xl mb-4">🏭</div>
          <p>No tokens created yet.</p>
          <p className="text-sm mt-2">Tokens will appear here as they are created via the factory.</p>
        </div>
      )}
    </motion.div>
  )
}