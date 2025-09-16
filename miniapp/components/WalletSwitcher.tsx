'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Copy, Check, ExternalLink, Wallet } from 'lucide-react'
import { useAccount, useDisconnect, useEnsName } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { triggerHapticFeedback } from '@/lib/telegram'

export default function WalletSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })

  const handleToggle = () => {
    triggerHapticFeedback('light')
    setIsOpen(!isOpen)
  }

  const handleCopyAddress = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      triggerHapticFeedback('success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const handleDisconnect = () => {
    triggerHapticFeedback('light')
    disconnect()
    setIsOpen(false)
  }

  const displayName = ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`

  return (
    <div className="relative">
      {/* Main Button */}
      {isConnected ? (
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-green-400">
            {displayName}
          </span>
          <ChevronDown className={`w-3 h-3 text-green-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 mini-button text-sm"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect</span>
        </button>
      )}

      {/* Dropdown for connected wallet */}
      <AnimatePresence>
        {isOpen && isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-72 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-lg shadow-xl z-50"
          >
            <div className="p-4">
              {/* Current Wallet Info */}
              <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Connected Wallet</span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 rounded hover:bg-gray-600/50 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <div className="text-sm text-white font-mono">
                  {address}
                </div>
                {ensName && (
                  <div className="text-xs text-gray-400 mt-1">
                    {ensName}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                    External Wallet
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowConnectModal(true)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700/50 text-gray-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Switch Wallet</span>
                </button>
                
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <span className="text-sm">Disconnect</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-lg p-6 max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <ConnectButton />
          </motion.div>
        </div>
      )}
    </div>
  )
} 