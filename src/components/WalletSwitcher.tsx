'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Lock, Unlock, Wallet, ExternalLink, Shield, Copy, Check } from 'lucide-react'
import { useSignerSelector, useAutoLock } from '@/wallet-lite/hooks'
import { useAccount, useDisconnect } from 'wagmi'

export default function WalletSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { 
    activeSigner, 
    activeWallet, 
    liteWallets, 
    externalWallets,
    unlockWallet,
    lockWallet,
    switchToExternalWallet
  } = useSignerSelector()
  const { autoLockTimeout, setAutoLockTimeout, disableAutoLock, isEnabled, locked } = useAutoLock()

  const [unlockWalletId, setUnlockWalletId] = useState('')
  const [password, setPassword] = useState('')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockLoading, setUnlockLoading] = useState(false)
  const [unlockError, setUnlockError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleUnlock = async () => {
    if (!unlockWalletId || !password) return

    setUnlockLoading(true)
    setUnlockError('')

    try {
      await unlockWallet(unlockWalletId, password)
      setShowUnlockModal(false)
      setPassword('')
      setUnlockWalletId('')
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Failed to unlock wallet')
    } finally {
      setUnlockLoading(false)
    }
  }

  const handleCopyAddress = async () => {
    if (!activeWallet?.address) return
    
    try {
      await navigator.clipboard.writeText(activeWallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  const getActiveWalletDisplay = () => {
    if (!activeWallet) {
      return { label: 'No Wallet', icon: Wallet, type: 'none' }
    }

    if (activeSigner?.type === 'lite') {
      return { 
        label: activeWallet.label || 'Lite Wallet', 
        icon: Shield, 
        type: 'lite',
        address: activeWallet.address
      }
    } else {
      return { 
        label: activeWallet.label || 'External Wallet', 
        icon: ExternalLink, 
        type: 'external',
        address: activeWallet.address
      }
    }
  }

  const activeDisplay = getActiveWalletDisplay()

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 transition-colors"
      >
        <activeDisplay.icon className="w-4 h-4" />
        <span className="text-sm font-medium text-white">
          {activeDisplay.label}
        </span>
        {activeDisplay.address && (
          <span className="text-xs text-gray-400 font-mono">
            {activeDisplay.address.slice(0, 6)}...{activeDisplay.address.slice(-4)}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50"
          >
            <div className="p-4">
              {/* Current Wallet */}
              {activeWallet && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Active Wallet</span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 rounded hover:bg-gray-600 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-sm text-white font-mono">
                    {activeWallet.address}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      activeSigner?.type === 'lite' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {activeSigner?.type === 'lite' ? 'Lite Wallet' : 'External'}
                    </span>
                    {activeSigner?.type === 'lite' && (
                      <button
                        onClick={lockWallet}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Lock className="w-3 h-3" />
                        Lock
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* External Wallets */}
              {externalWallets.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">External Wallets</h3>
                  <div className="space-y-2">
                    {externalWallets.map((wallet) => (
                      <button
                        key={wallet.address}
                        onClick={() => {
                          switchToExternalWallet(wallet.address)
                          setIsOpen(false)
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          activeSigner?.address === wallet.address
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'hover:bg-gray-700/50 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{wallet.label}</div>
                            <div className="text-xs text-gray-400 font-mono">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lite Wallets */}
              {liteWallets.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Lite Wallets</h3>
                  <div className="space-y-2">
                    {liteWallets.map((wallet) => {
                      const isActive = activeSigner?.id === wallet.id
                      const isUnlocked = !locked && isActive
                      
                      return (
                        <div
                          key={wallet.id}
                          className={`p-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'hover:bg-gray-700/50 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{wallet.label}</div>
                              <div className="text-xs text-gray-400 font-mono">
                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isUnlocked ? (
                                <Unlock className="w-3 h-3 text-green-400" />
                              ) : (
                                <Lock className="w-3 h-3 text-gray-400" />
                              )}
                              {!isUnlocked && (
                                <button
                                  onClick={() => {
                                    setUnlockWalletId(wallet.id)
                                    setShowUnlockModal(true)
                                  }}
                                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                                >
                                  Unlock
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Auto-lock Settings */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Auto-lock Settings</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setAutoLockTimeout(5 * 60 * 1000)} // 5 minutes
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      autoLockTimeout === 5 * 60 * 1000
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    5 minutes
                  </button>
                  <button
                    onClick={() => setAutoLockTimeout(15 * 60 * 1000)} // 15 minutes
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      autoLockTimeout === 15 * 60 * 1000
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    15 minutes
                  </button>
                  <button
                    onClick={() => setAutoLockTimeout(60 * 60 * 1000)} // 1 hour
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      autoLockTimeout === 60 * 60 * 1000
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    1 hour
                  </button>
                  <button
                    onClick={disableAutoLock}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      !isEnabled
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    Disabled
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      // Navigate to wallet management
                      window.location.href = '/wallet/manage'
                    }}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Manage Wallets
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => {
                        disconnect()
                        setIsOpen(false)
                      }}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUnlockModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Unlock Wallet</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter wallet password"
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                </div>

                {unlockError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{unlockError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlock}
                    disabled={unlockLoading || !password}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {unlockLoading ? 'Unlocking...' : 'Unlock'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 