'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { Shield, Fingerprint, Smartphone, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { usePasskeys } from '@/wallet-lite/hooks'
import { useWalletStore } from '@/wallet-lite/store'

export default function WalletSecurityPage() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [isPasskeyEnabled, setIsPasskeyEnabled] = useState(false)
  const [passkeyMeta, setPasskeyMeta] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { liteWallets } = useWalletStore()
  const {
    isSupported,
    isSecure,
    enablePasskey,
    unlockWithPasskey,
    disablePasskey,
    checkPasskeyEnabled,
    getPasskeyMeta
  } = usePasskeys()

  useEffect(() => {
    if (selectedWallet) {
      loadPasskeyStatus()
    }
  }, [selectedWallet])

  const loadPasskeyStatus = async () => {
    if (!selectedWallet) return

    try {
      const enabled = await checkPasskeyEnabled(selectedWallet)
      setIsPasskeyEnabled(enabled)

      if (enabled) {
        const meta = await getPasskeyMeta(selectedWallet)
        setPasskeyMeta(meta)
      }
    } catch (error) {
      console.error('Failed to load passkey status:', error)
    }
  }

  const handleEnablePasskey = async () => {
    if (!selectedWallet) return

    setIsLoading(true)
    setMessage(null)

    try {
      // For demo purposes, we'll create a mock vault key
      // In a real implementation, this would come from the actual vault
      const vaultKey = crypto.getRandomValues(new Uint8Array(32)).buffer
      
      const result = await enablePasskey(selectedWallet, vaultKey)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Passkey enabled successfully!' })
        await loadPasskeyStatus()
      } else {
        setMessage({ type: 'error', text: `Failed to enable passkey: ${result.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enable passkey' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisablePasskey = async () => {
    if (!selectedWallet) return

    setIsLoading(true)
    setMessage(null)

    try {
      const success = await disablePasskey(selectedWallet)
      
      if (success) {
        setMessage({ type: 'success', text: 'Passkey disabled successfully!' })
        await loadPasskeyStatus()
      } else {
        setMessage({ type: 'error', text: 'Failed to disable passkey' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable passkey' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestUnlock = async () => {
    if (!selectedWallet) return

    setIsLoading(true)
    setMessage(null)

    try {
      const result = await unlockWithPasskey(selectedWallet)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Passkey unlock test successful!' })
      } else {
        setMessage({ type: 'error', text: `Unlock test failed: ${result.error}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Unlock test failed' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              Wallet Security
            </h1>
            <p className="text-gray-300 text-lg">
              Manage biometric unlock and security settings for your wallets
            </p>
          </div>

          {/* WebAuthn Support Status */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-purple-400" />
              WebAuthn Support
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {isSupported ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-gray-300">
                  WebAuthn Support: {isSupported ? 'Available' : 'Not Available'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {isSecure ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-gray-300">
                  Secure Context: {isSecure ? 'HTTPS/Localhost' : 'Insecure'}
                </span>
              </div>
            </div>

            {!isSupported && (
              <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    WebAuthn is not supported in your browser. Passkeys will not be available.
                  </span>
                </div>
              </div>
            )}

            {!isSecure && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Secure context required. Passkeys only work over HTTPS or localhost.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Selection */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Select Wallet</h2>
            
            {liteWallets.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No lite wallets found. Create a wallet first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liteWallets.map((wallet) => (
                  <motion.button
                    key={wallet.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedWallet(wallet.id)}
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedWallet === wallet.id
                        ? 'bg-purple-600/20 border-purple-500/50'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="font-medium text-white">{wallet.label}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Passkey Management */}
          {selectedWallet && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-purple-400" />
                Passkey Management
              </h2>

              {/* Current Status */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-gray-300">Status:</span>
                  {isPasskeyEnabled ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400">
                      <XCircle className="w-4 h-4" />
                      <span>Disabled</span>
                    </div>
                  )}
                </div>

                {passkeyMeta && (
                  <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Device:</span>
                      <span className="text-white">{passkeyMeta.deviceName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(passkeyMeta.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Last Used:</span>
                      <span className="text-white">{formatDate(passkeyMeta.lastUsed)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                {!isPasskeyEnabled ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEnablePasskey}
                    disabled={!isSupported || !isSecure || isLoading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Enabling...' : 'Enable Passkey'}
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTestUnlock}
                      disabled={isLoading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isLoading ? 'Testing...' : 'Test Unlock'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDisablePasskey}
                      disabled={isLoading}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {isLoading ? 'Disabling...' : 'Disable Passkey'}
                    </motion.button>
                  </>
                )}
              </div>

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-900/30 border border-green-500/30 text-green-400'
                      : 'bg-red-900/30 border border-red-500/30 text-red-400'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Security Notes */}
          <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Security Notes</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Passkeys are device-bound and cannot be transferred between devices</li>
              <li>• Password fallback remains available as a recovery method</li>
              <li>• Auto-lock will clear the vault key from memory</li>
              <li>• Passkeys require biometric authentication (Face ID, Touch ID, Windows Hello)</li>
              <li>• No secrets are ever sent to the server</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 