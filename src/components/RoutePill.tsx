'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, TrendingUp, Zap } from 'lucide-react'
import { BestQuote } from '@/lib/quotes'

interface RoutePillProps {
  bestQuote: BestQuote | null
  isLoading?: boolean
  className?: string
}

export default function RoutePill({ bestQuote, isLoading = false, className = '' }: RoutePillProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-gray-600 rounded"></div>
        <div className="w-16 h-4 bg-gray-600 rounded"></div>
      </div>
    )
  }

  if (!bestQuote) {
    return null
  }

  const { best, quote, alternatives } = bestQuote
  const isBalancer = best === 'Balancer'
  const hasAlternatives = alternatives.shahSwap && alternatives.balancer

  const getRouteColor = () => {
    if (isBalancer) {
      return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    }
    return 'bg-purple-500/20 border-purple-500/30 text-purple-400'
  }

  const getRouteIcon = () => {
    if (isBalancer) {
      return <TrendingUp className="w-4 h-4" />
    }
    return <Zap className="w-4 h-4" />
  }

  const getPriceImpactColor = (priceImpactBps: number) => {
    if (priceImpactBps < 100) return 'text-green-400'
    if (priceImpactBps < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatPriceImpact = (priceImpactBps: number) => {
    return (priceImpactBps / 100).toFixed(2)
  }

  const getSlippageColor = (slippageBps: number) => {
    if (slippageBps <= 50) return 'text-green-400'
    if (slippageBps <= 100) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-help transition-colors ${getRouteColor()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getRouteIcon()}
        <span className="text-sm font-medium">
          Best Route: {best}
        </span>
        {hasAlternatives && (
          <Info className="w-3 h-3 opacity-70" />
        )}
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Route Details</span>
                <span className={`text-xs px-2 py-1 rounded ${getRouteColor()}`}>
                  {best}
                </span>
              </div>

              {/* Current Route */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Current Route:</span>
                  <span className="font-medium">{quote.routeLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Hops:</span>
                  <span className="font-medium">{quote.hops}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className={`font-medium ${getPriceImpactColor(quote.priceImpactBps)}`}>
                    {formatPriceImpact(quote.priceImpactBps)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Slippage:</span>
                  <span className={`font-medium ${getSlippageColor(quote.effectiveSlippageBps)}`}>
                    {(quote.effectiveSlippageBps / 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Alternative Routes */}
              {hasAlternatives && (
                <div className="pt-2 border-t border-gray-600">
                  <span className="text-xs text-gray-400">Alternative Routes:</span>
                  <div className="mt-2 space-y-1">
                    {alternatives.shahSwap && best !== 'ShahSwap' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">ShahSwap:</span>
                        <span className="text-gray-300">
                          {formatPriceImpact(alternatives.shahSwap.priceImpactBps)}% impact
                        </span>
                      </div>
                    )}
                    {alternatives.balancer && best !== 'Balancer' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Balancer:</span>
                        <span className="text-gray-300">
                          {formatPriceImpact(alternatives.balancer.priceImpactBps)}% impact
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Balancer Read-Only Notice */}
              {isBalancer && (
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex items-center gap-2 text-xs text-yellow-400">
                    <Info className="w-3 h-3" />
                    <span>Balancer routing is read-only. Execution will use ShahSwap.</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 