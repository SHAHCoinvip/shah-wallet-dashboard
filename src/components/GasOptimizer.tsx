'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Zap, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useGasOptimizer } from '@/hooks/useGasOptimizer'

interface GasOptimizerProps {
  transactionType?: 'transfer' | 'swap' | 'stake' | 'approve' | 'custom'
  complexity?: 'simple' | 'medium' | 'complex'
  onSettingsChange?: (settings: any) => void
  className?: string
}

export default function GasOptimizer({
  transactionType = 'transfer',
  complexity = 'simple',
  onSettingsChange,
  className = ''
}: GasOptimizerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showNetworkComparison, setShowNetworkComparison] = useState(false)
  
  const {
    settings,
    gasPrices,
    recommendation,
    loading,
    error,
    estimatedCost,
    estimatedTime,
    tips,
    updateSettings,
    updateSettingsFromPreset,
    compareNetworks,
    suggestOptimalSettings,
    isEIP1559,
    currentNetwork,
    presets
  } = useGasOptimizer(transactionType, complexity)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount)
  }

  const formatGasPrice = (price: number) => {
    if (price >= 1e9) {
      return `${(price / 1e9).toFixed(1)} Gwei`
    } else if (price >= 1e6) {
      return `${(price / 1e6).toFixed(1)} Mwei`
    }
    return `${price.toFixed(0)} Wei`
  }

  const handlePresetChange = (preset: string) => {
    updateSettingsFromPreset(preset as any)
    onSettingsChange?.(settings)
  }

  const handleManualChange = (field: string, value: string) => {
    updateSettings({ [field]: value })
    onSettingsChange?.(settings)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Gas Optimization</h3>
              <p className="text-sm text-gray-500">
                {currentNetwork?.name} • {isEIP1559 ? 'EIP-1559' : 'Legacy'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNetworkComparison(!showNetworkComparison)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Compare networks"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {formatCurrency(estimatedCost.usd)}
            </div>
            <div className="text-xs text-gray-500">Estimated Cost</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {estimatedTime}
            </div>
            <div className="text-xs text-gray-500">Est. Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {settings.gasLimit}
            </div>
            <div className="text-xs text-gray-500">Gas Limit</div>
          </div>
        </div>
      </div>

      {/* Network Comparison */}
      <AnimatePresence>
        {showNetworkComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-100"
          >
            <div className="p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-800">Network Comparison</h4>
              </div>
              
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-blue-100 rounded"></div>
                  ))}
                </div>
              ) : recommendation ? (
                <div className="space-y-2">
                  {recommendation.savings.slice(0, 3).map((saving, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{saving.network}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600">
                          Save {saving.savingsPercent.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(saving.savingsUsd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-blue-600">
                  No cheaper networks found for this transaction.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 space-y-6"
          >
            {/* Presets */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Speed Presets</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.preset === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{preset.label}</div>
                    <div className="text-xs text-gray-500">{preset.time}</div>
                    <div className="text-xs text-gray-500">{preset.cost}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* EIP-1559 Settings */}
            {isEIP1559 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">EIP-1559 Settings</h4>
                
                {/* Max Fee Per Gas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Fee Per Gas (Gwei)
                  </label>
                  <input
                    type="number"
                    value={settings.maxFeePerGas}
                    onChange={(e) => handleManualChange('maxFeePerGas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum total fee you're willing to pay
                  </p>
                </div>

                {/* Max Priority Fee Per Gas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Priority Fee Per Gas (Gwei)
                  </label>
                  <input
                    type="number"
                    value={settings.maxPriorityFeePerGas}
                    onChange={(e) => handleManualChange('maxPriorityFeePerGas', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Auto"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip to miners for faster processing
                  </p>
                </div>
              </div>
            )}

            {/* Legacy Gas Price */}
            {!isEIP1559 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Gas Price</h4>
                <input
                  type="number"
                  value={settings.maxFeePerGas}
                  onChange={(e) => handleManualChange('maxFeePerGas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gas price in Gwei
                </p>
              </div>
            )}

            {/* Gas Limit */}
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Gas Limit</h4>
              <input
                type="number"
                value={settings.gasLimit}
                onChange={(e) => handleManualChange('gasLimit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="21000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum gas units for this transaction
              </p>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Optimization Tips</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1 h-1 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={suggestOptimalSettings}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Suggest Optimal
              </button>
              <button
                onClick={compareNetworks}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Compare Networks
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
} 