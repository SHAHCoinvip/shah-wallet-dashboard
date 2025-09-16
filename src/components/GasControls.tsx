'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { ethers } from 'ethers'
import { 
  getFeeData, 
  estimateTxCost, 
  formatGasPrice, 
  parseGasPrice,
  isEIP1559Supported,
  type FeeData,
  type GasEstimate,
  type TxCost
} from '@/lib/gas'

interface GasControlsProps {
  onChange: (fees: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }) => void
  defaultPreset?: 'slow' | 'avg' | 'fast'
  gasLimitHint?: bigint
  className?: string
}

type PresetType = 'slow' | 'avg' | 'fast' | 'custom'

export default function GasControls({ 
  onChange, 
  defaultPreset = 'avg',
  gasLimitHint = 210000n,
  className = ''
}: GasControlsProps) {
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  
  const [feeData, setFeeData] = useState<FeeData | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<PresetType>(defaultPreset)
  const [customMaxFee, setCustomMaxFee] = useState('')
  const [customPriorityFee, setCustomPriorityFee] = useState('')
  const [txCost, setTxCost] = useState<TxCost>({ eth: '0', usd: '0.00' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supportsEIP1559, setSupportsEIP1559] = useState(true)

  // Fetch fee data on mount and chain change
  useEffect(() => {
    if (!publicClient || !chain) return
    
    const fetchFeeData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Check EIP-1559 support
        const provider = new ethers.BrowserProvider(window.ethereum)
        const eip1559Supported = isEIP1559Supported(provider)
        setSupportsEIP1559(eip1559Supported)
        
        if (!eip1559Supported) {
          setError('EIP-1559 not supported on this network')
          setLoading(false)
          return
        }
        
        const data = await getFeeData(provider)
        setFeeData(data)
        
        // Set initial custom values
        setCustomMaxFee(formatGasPrice(data.maxFeePerGas))
        setCustomPriorityFee(formatGasPrice(data.maxPriorityFeeSuggestions.avg))
        
      } catch (err) {
        console.error('Error fetching fee data:', err)
        setError('Failed to load gas fees')
      } finally {
        setLoading(false)
      }
    }
    
    fetchFeeData()
  }, [publicClient, chain])

  // Update transaction cost when fees change
  useEffect(() => {
    if (!feeData || !supportsEIP1559) return
    
    const updateTxCost = async () => {
      try {
        let maxFeePerGas: bigint
        let maxPriorityFeePerGas: bigint
        
        if (selectedPreset === 'custom') {
          maxFeePerGas = parseGasPrice(customMaxFee || '0')
          maxPriorityFeePerGas = parseGasPrice(customPriorityFee || '0')
        } else {
          maxPriorityFeePerGas = feeData.maxPriorityFeeSuggestions[selectedPreset]
          maxFeePerGas = feeData.baseFee * 2n + maxPriorityFeePerGas
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum)
        const cost = await estimateTxCost(
          { gasLimit: gasLimitHint, maxFeePerGas, maxPriorityFeePerGas },
          provider
        )
        setTxCost(cost)
        
        // Call onChange with current fees
        onChange({ maxFeePerGas, maxPriorityFeePerGas })
        
      } catch (err) {
        console.error('Error calculating transaction cost:', err)
      }
    }
    
    updateTxCost()
  }, [feeData, selectedPreset, customMaxFee, customPriorityFee, gasLimitHint, supportsEIP1559, onChange])

  if (!process.env.NEXT_PUBLIC_ENABLE_GAS_UI || process.env.NEXT_PUBLIC_ENABLE_GAS_UI !== 'true') {
    return null
  }

  if (loading) {
    return (
      <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !supportsEIP1559) {
    return (
      <div className={`bg-red-900/20 border border-red-500/30 rounded-xl p-4 ${className}`}>
        <p className="text-red-400 text-sm">
          {error || 'EIP-1559 gas controls not available on this network'}
        </p>
      </div>
    )
  }

  if (!feeData) {
    return null
  }

  const getPresetButtonClass = (preset: PresetType) => {
    const baseClass = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors'
    return selectedPreset === preset
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} bg-gray-700 text-gray-300 hover:bg-gray-600`
  }

  const isUnderBaseFee = selectedPreset === 'custom' && 
    parseGasPrice(customMaxFee || '0') < feeData.baseFee

  return (
    <div className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-200">Gas Settings</h4>
        <div className="text-xs text-gray-400">
          Base: {formatGasPrice(feeData.baseFee)} Gwei
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setSelectedPreset('slow')}
          className={getPresetButtonClass('slow')}
        >
          Slow
        </button>
        <button
          onClick={() => setSelectedPreset('avg')}
          className={getPresetButtonClass('avg')}
        >
          Avg
        </button>
        <button
          onClick={() => setSelectedPreset('fast')}
          className={getPresetButtonClass('fast')}
        >
          Fast
        </button>
        <button
          onClick={() => setSelectedPreset('custom')}
          className={getPresetButtonClass('custom')}
        >
          Custom
        </button>
      </div>

      {/* Custom Inputs */}
      {selectedPreset === 'custom' && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Max Priority Fee (Gwei)
            </label>
            <input
              type="number"
              value={customPriorityFee}
              onChange={(e) => setCustomPriorityFee(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="0.1"
              step="0.1"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Max Fee Per Gas (Gwei)
            </label>
            <input
              type="number"
              value={customMaxFee}
              onChange={(e) => setCustomMaxFee(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="20"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Priority Fee:</span>
          <span className="text-white">
            {selectedPreset === 'custom' 
              ? `${customPriorityFee || '0'} Gwei`
              : `${formatGasPrice(feeData.maxPriorityFeeSuggestions[selectedPreset])} Gwei`
            }
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Max Fee:</span>
          <span className="text-white">
            {selectedPreset === 'custom'
              ? `${customMaxFee || '0'} Gwei`
              : `${formatGasPrice(feeData.baseFee * 2n + feeData.maxPriorityFeeSuggestions[selectedPreset])} Gwei`
            }
          </span>
        </div>
      </div>

      {/* Transaction Cost */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-blue-300">Estimated Cost:</span>
          <span className="text-white">
            {parseFloat(txCost.eth).toFixed(6)} ETH
          </span>
        </div>
        {parseFloat(txCost.usd) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-blue-300">USD Value:</span>
            <span className="text-white">${txCost.usd}</span>
          </div>
        )}
      </div>

      {/* Warning */}
      {isUnderBaseFee && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-xs">
            ⚠️ Max fee is below current base fee. Transaction may fail.
          </p>
        </div>
      )}
    </div>
  )
} 