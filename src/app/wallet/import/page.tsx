'use client'

import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'
import { useLiteWallets } from '@/wallet-lite/hooks'
import { validateMnemonicPhrase } from '@/wallet-lite/mnemonic'

export default function ImportWalletPage() {
  const router = useRouter()
  const { importWallet, canCreate } = useLiteWallets()
  
  const [step, setStep] = useState<'phrase' | 'password' | 'success'>('phrase')
  const [mnemonic, setMnemonic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [walletLabel, setWalletLabel] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMnemonicSubmit = () => {
    setError('')
    
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase')
      return
    }

    const cleanMnemonic = mnemonic.trim().toLowerCase()
    
    if (!validateMnemonicPhrase(cleanMnemonic)) {
      setError('Invalid mnemonic phrase. Please check your 12 or 24-word phrase.')
      return
    }

    setStep('password')
  }

  const handlePasswordSubmit = () => {
    setError('')
    
    if (!password) {
      setError('Please enter a password')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!walletLabel.trim()) {
      setError('Please enter a wallet label')
      return
    }

    handleImport()
  }

  const handleImport = async () => {
    if (!canCreate) {
      setError('Maximum number of wallets reached (3)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const cleanMnemonic = mnemonic.trim().toLowerCase()
      
      await importWallet({
        mnemonic: cleanMnemonic,
        password,
        label: walletLabel.trim()
      })

      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet')
    } finally {
      setLoading(false)
    }
  }

  if (!canCreate && step === 'phrase') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Maximum Wallets Reached</h2>
          <p className="text-gray-300 mb-6">
            You can only import up to 3 lite wallets. Please delete an existing wallet first.
          </p>
          <button
            onClick={() => router.push('/wallet/manage')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Manage Wallets
          </button>
        </motion.div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center"
        >
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Wallet Imported Successfully!</h2>
          <p className="text-gray-300 mb-6">
            Your wallet has been imported and encrypted. You can now use it to sign transactions.
          </p>
          <button
            onClick={() => router.push('/wallet/manage')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Wallet Manager
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-800 rounded-lg p-6"
      >
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Import Wallet</h1>
            <p className="text-gray-300 text-sm">
              {step === 'phrase' ? 'Enter your mnemonic phrase' : 'Set wallet password'}
            </p>
          </div>
        </div>

        {step === 'phrase' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mnemonic Phrase
              </label>
              <div className="relative">
                <textarea
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="Enter your 12 or 24-word mnemonic phrase"
                  className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-gray-600 transition-colors"
                >
                  {showMnemonic ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {!showMnemonic && (
                <p className="text-xs text-gray-400 mt-1">
                  Your phrase is hidden for security. Click the eye icon to reveal.
                </p>
              )}
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <h3 className="text-sm font-medium text-blue-400 mb-2">Security Notice</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Never share your mnemonic phrase with anyone</li>
                <li>• This phrase gives full access to your wallet</li>
                <li>• Your phrase is encrypted locally and never sent to our servers</li>
                <li>• Make sure you're on the correct website before entering</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleMnemonicSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Continue
            </button>
          </motion.div>
        )}

        {step === 'password' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Label
              </label>
              <input
                type="text"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="e.g., My Imported Wallet"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum 8 characters. This encrypts your wallet locally.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handlePasswordSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
} 