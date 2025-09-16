'use client'

import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Copy, Check, AlertTriangle, Shield, Lock } from 'lucide-react'
import { useLiteWallets } from '@/wallet-lite/hooks'
import { generateMnemonicPhrase, getMnemonicStrength } from '@/wallet-lite/mnemonic'

export default function CreateWalletPage() {
  const router = useRouter()
  const { createWallet, canCreate } = useLiteWallets()
  
  const [step, setStep] = useState<'generate' | 'backup' | 'confirm' | 'password' | 'complete'>('generate')
  const [mnemonic, setMnemonic] = useState('')
  const [strength, setStrength] = useState<128 | 256>(128)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [label, setLabel] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmWords, setConfirmWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Generate mnemonic on mount
  useState(() => {
    if (!mnemonic) {
      const newMnemonic = generateMnemonicPhrase(strength)
      setMnemonic(newMnemonic)
    }
  })

  const handleGenerateNew = () => {
    const newMnemonic = generateMnemonicPhrase(strength)
    setMnemonic(newMnemonic)
    setRevealed(false)
    setCopied(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleBackup = () => {
    if (!revealed) {
      setRevealed(true)
    } else {
      setStep('confirm')
      // Create shuffled word list for confirmation
      const words = mnemonic.split(' ')
      const shuffled = [...words].sort(() => Math.random() - 0.5)
      setConfirmWords(shuffled)
    }
  }

  const handleWordSelect = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word))
    } else {
      setSelectedWords([...selectedWords, word])
    }
  }

  const handleConfirm = () => {
    const correctOrder = mnemonic.split(' ')
    const isCorrect = selectedWords.length === correctOrder.length &&
      selectedWords.every((word, index) => word === correctOrder[index])
    
    if (isCorrect) {
      setStep('password')
    } else {
      setError('Incorrect word order. Please try again.')
      setSelectedWords([])
    }
  }

  const handleCreate = async () => {
    if (!label.trim()) {
      setError('Please enter a wallet label')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!canCreate) {
      setError('Maximum number of wallets reached (3)')
      return
    }

    setLoading(true)
    setError('')

    try {
      await createWallet({
        label: label.trim(),
        password
      })
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/wallet/manage')
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="glass-card text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Maximum Wallets Reached</h2>
            <p className="text-gray-300 mb-6">
              You can only create up to 3 lite wallets. Please delete an existing wallet first.
            </p>
            <button
              onClick={() => router.push('/wallet/manage')}
              className="btn-primary w-full"
            >
              Manage Wallets
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Wallet</h1>
          <p className="text-gray-300">Generate a secure wallet with backup phrase</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['generate', 'backup', 'confirm', 'password', 'complete'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step === s ? 'bg-blue-500 text-white' : 
                    ['generate', 'backup', 'confirm', 'password', 'complete'].indexOf(step) > i ? 
                    'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}
                `}>
                  {i + 1}
                </div>
                {i < 4 && (
                  <div className={`w-8 h-1 mx-2 ${step === s ? 'bg-blue-500' : 'bg-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card"
        >
          {step === 'generate' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-white">Generate Recovery Phrase</h2>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Strength
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStrength(128)}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      strength === 128 
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    12 Words (128-bit)
                  </button>
                  <button
                    onClick={() => setStrength(256)}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                      strength === 256 
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    24 Words (256-bit)
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Recovery Phrase
                  </label>
                  <button
                    onClick={handleGenerateNew}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Generate New
                  </button>
                </div>
                
                <div className="relative">
                  <div className={`
                    p-4 rounded-lg border-2 transition-all duration-300
                    ${revealed 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-gray-600 bg-gray-800/50'
                    }
                  `}>
                    <div className={`
                      font-mono text-lg leading-relaxed
                      ${revealed ? 'text-white' : 'text-gray-400 blur-sm select-none'}
                    `}>
                      {mnemonic}
                    </div>
                  </div>
                  
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => setRevealed(!revealed)}
                      className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {revealed && (
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Important Security Notice</p>
                    <ul className="space-y-1">
                      <li>• Write down your recovery phrase and store it securely</li>
                      <li>• Never share your recovery phrase with anyone</li>
                      <li>• Keep it offline and away from digital devices</li>
                      <li>• You'll need this phrase to recover your wallet</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBackup}
                disabled={!revealed}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                I've Written Down My Phrase
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Check className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold text-white">Confirm Recovery Phrase</h2>
              </div>

              <p className="text-gray-300 mb-6">
                Select the words in the correct order to confirm you've backed up your recovery phrase.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selected Words ({selectedWords.length}/{mnemonic.split(' ').length})
                </label>
                <div className="min-h-[60px] p-3 rounded-lg border border-gray-600 bg-gray-800/50">
                  <div className="flex flex-wrap gap-2">
                    {selectedWords.map((word, index) => (
                      <span
                        key={`${word}-${index}`}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-mono"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Available Words
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {confirmWords.map((word, index) => (
                    <button
                      key={`${word}-${index}`}
                      onClick={() => handleWordSelect(word)}
                      disabled={selectedWords.includes(word)}
                      className={`
                        py-2 px-3 rounded-lg border text-sm font-mono transition-colors
                        ${selectedWords.includes(word)
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                        }
                      `}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('generate')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedWords.length !== mnemonic.split(' ').length}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {step === 'password' && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-white">Set Wallet Password</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., My Trading Wallet"
                    className="input-field"
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
                    className="input-field"
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
                    className="input-field"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('confirm')}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Wallet Created Successfully!</h2>
              <p className="text-gray-300 mb-6">
                Your new wallet has been created and encrypted. You can now use it to sign transactions.
              </p>

              <button
                onClick={handleComplete}
                className="btn-primary w-full"
              >
                Go to Wallet Manager
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 