'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Badge from './Badge'
import { 
  linkToSwap, 
  linkToEtherscan, 
  linkToEtherscanAddress, 
  shortenAddress, 
  formatTimeAgo 
} from '@/lib/discovery'

interface TokenRowProps {
  address: string
  name?: string
  symbol?: string
  deployer?: string
  createdAt?: Date
  isVerified?: boolean
  isNew?: boolean
  isTrending?: boolean
  showActions?: boolean
  className?: string
}

export default function TokenRow({
  address,
  name,
  symbol,
  deployer,
  createdAt,
  isVerified = false,
  isNew = false,
  isTrending = false,
  showActions = true,
  className = ''
}: TokenRowProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const handleSwap = () => {
    router.push(linkToSwap(address))
  }

  const handleView = () => {
    window.open(linkToEtherscan(address), '_blank')
  }

  const displayName = name || symbol || 'Unknown Token'
  const displaySymbol = symbol || '???'

  return (
    <div
      className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 transition-all hover:border-gray-600 hover:bg-gray-800/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between">
        {/* Token Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Token Logo */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {displaySymbol.slice(0, 2).toUpperCase()}
          </div>

          {/* Token Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-white truncate">
                {displayName}
              </h3>
              <span className="text-gray-400 text-sm">
                ({displaySymbol})
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="font-mono">
                {shortenAddress(address)}
              </span>
              
              {deployer && (
                <>
                  <span>•</span>
                  <span>by {shortenAddress(deployer)}</span>
                </>
              )}
              
              {createdAt && (
                <>
                  <span>•</span>
                  <span>{formatTimeAgo(createdAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center space-x-2 mr-4">
          {isVerified && <Badge variant="verified">✓ Verified</Badge>}
          {isNew && <Badge variant="new">🆕 New</Badge>}
          {isTrending && <Badge variant="trending">📈 Trending</Badge>}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSwap}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Swap
            </button>
            <button
              onClick={handleView}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              View
            </button>
          </div>
        )}
      </div>

      {/* Hover Actions (Mobile-friendly) */}
      {isHovered && showActions && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end space-x-2">
          <a
            href={linkToEtherscanAddress(deployer || '')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            View Deployer
          </a>
        </div>
      )}
    </div>
  )
} 