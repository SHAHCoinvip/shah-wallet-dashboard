'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LaunchpadDrop, getDropStatusDisplay, getDropProgress, getTimeRemaining } from '@/lib/launchpad'

interface DropCardProps {
  drop: LaunchpadDrop
  className?: string
}

export default function DropCard({ drop, className = '' }: DropCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(
    drop.status === 'upcoming' ? drop.startAt : drop.endAt
  ))

  const statusDisplay = getDropStatusDisplay(drop)
  const progress = getDropProgress(drop)

  // Update countdown every second for live/upcoming drops
  useEffect(() => {
    if (drop.status === 'live' || drop.status === 'upcoming') {
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining(
          drop.status === 'upcoming' ? drop.startAt : drop.endAt
        ))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [drop.status, drop.startAt, drop.endAt])

  const getTimerLabel = () => {
    if (drop.status === 'upcoming') return 'Starts in:'
    if (drop.status === 'live') return 'Ends in:'
    return ''
  }

  const formatTime = (time: typeof timeRemaining) => {
    if (time.isExpired) return 'Expired'
    
    const parts = []
    if (time.days > 0) parts.push(`${time.days}d`)
    if (time.hours > 0) parts.push(`${time.hours}h`)
    if (time.minutes > 0) parts.push(`${time.minutes}m`)
    if (parts.length === 0) parts.push(`${time.seconds}s`)
    
    return parts.slice(0, 2).join(' ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 ${className}`}
    >
      {/* Drop Image */}
      <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600">
        {drop.imageUrl !== '/api/placeholder/400/400' ? (
          <img 
            src={drop.imageUrl} 
            alt={drop.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl">
              {drop.type === 'nft' ? '🎨' : '🪙'}
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900/80 backdrop-blur-sm ${statusDisplay.color}`}>
            {statusDisplay.icon} {statusDisplay.text}
          </span>
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-900/80 backdrop-blur-sm text-white">
            {drop.type.toUpperCase()}
          </span>
        </div>

        {/* Progress Bar for Live Drops */}
        {drop.status === 'live' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm p-2">
            <div className="flex justify-between text-xs text-white mb-1">
              <span>{drop.currentSupply} sold</span>
              <span>{drop.maxSupply} total</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Drop Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{drop.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <img 
                src={drop.partner.logo !== '/api/placeholder/64/64' ? drop.partner.logo : undefined}
                alt={drop.partner.name}
                className="w-4 h-4 rounded-full bg-gray-600"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span>{drop.partner.name}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {drop.description}
        </p>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {drop.features.slice(0, 2).map((feature, index) => (
              <span key={index} className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                {feature}
              </span>
            ))}
            {drop.features.length > 2 && (
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                +{drop.features.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-400">Price</div>
            <div className="font-bold text-white">
              ${drop.priceUSD}
              {drop.priceShah && (
                <span className="text-sm text-yellow-400 ml-2">
                  (~{parseFloat(drop.priceShah).toFixed(2)} SHAH)
                </span>
              )}
            </div>
          </div>
          
          {(drop.status === 'live' || drop.status === 'upcoming') && (
            <div className="text-right">
              <div className="text-sm text-gray-400">{getTimerLabel()}</div>
              <div className="font-bold text-white text-sm">
                {formatTime(timeRemaining)}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link
          href={`/launchpad/${drop.id}`}
          className={`w-full inline-block text-center py-3 px-4 rounded-xl font-medium transition-colors ${
            drop.status === 'live'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : drop.status === 'upcoming'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : drop.status === 'sold_out'
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {drop.status === 'live' && '🔴 Buy Now'}
          {drop.status === 'upcoming' && '🔜 View Details'}
          {drop.status === 'sold_out' && '🔥 Sold Out'}
          {drop.status === 'ended' && '✅ Ended'}
        </Link>
      </div>
    </motion.div>
  )
}