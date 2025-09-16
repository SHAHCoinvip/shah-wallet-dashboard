'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  CONTRACTS, 
  FEATURES, 
  TokenFeatures, 
  TokenCreationArgs,
  getFeatureBitmap,
  validateTokenParams,
  decodeTokenCreated,
  generateEtherscanVerification,
  formatShahPrice,
  calcShahForUsd,
  PRICING
} from '@/lib/factory'
import { SHAHFactoryABI } from '@/abi/SHAHFactory'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'

type PaymentMethod = 'shah' | 'card'
type CreateStep = 'idle' | 'approving' | 'creating' | 'success'

export default function FactoryPage() {
  const { address, isConnected } = useAccount()
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    initialSupply: '',
    owner: address || '',
    maxSupply: ''
  })
  
  const [features, setFeatures] = useState<TokenFeatures>({
    basic: true,
    burnable: false,
    pausable: false,
    capped: false,
    ownable: true,
    upgradeable: false
  })
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('shah')
  const [createStep, setCreateStep] = useState<CreateStep>('idle')
  const [createdTokenAddress, setCreatedTokenAddress] = useState<`0x${string}` | null>(null)
  const [requiredShahAmount, setRequiredShahAmount] = useState<string>('0')
  const [stripeSessionId, setStripeSessionId] = useState<string | null>(null)
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false)
  
  // Contract reads
  const { data: shahPriceData } = useReadContract({
    address: CONTRACTS.SHAH_PRICE_ORACLE,
    abi: SHAHPriceOracleABI,
    functionName: 'getPriceInUSD',
  })
  
  const shahPrice = formatShahPrice(shahPriceData)
  
  const { data: shahBalance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })
  
  const { data: shahAllowance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'allowance',
    args: [address!, CONTRACTS.SHAH_FACTORY],
    query: { enabled: !!address }
  })
  
  // Contract writes
  const { writeContract: approveShah, data: approveHash } = useWriteContract()
  const { writeContract: createToken, data: createHash } = useWriteContract()
  
  // Transaction receipts
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      toast.success('✅ SHAH approved successfully!')
      setCreateStep('creating')
      handleCreateToken()
    },
    onError: () => {
      toast.error('❌ SHAH approval failed')
      setCreateStep('idle')
    }
  })
  
  const { isLoading: isCreating } = useWaitForTransactionReceipt({
    hash: createHash,
    onSuccess: (receipt) => {
      const tokenAddress = decodeTokenCreated(receipt.logs)
      if (tokenAddress) {
        setCreatedTokenAddress(tokenAddress)
        setCreateStep('success')
        toast.success('🎉 Token created successfully!')
      } else {
        toast.error('❌ Failed to get token address from transaction')
        setCreateStep('idle')
      }
    },
    onError: () => {
      toast.error('❌ Token creation failed')
      setCreateStep('idle')
    }
  })
  
  // Update owner when wallet connects
  useEffect(() => {
    if (address && !formData.owner) {
      setFormData(prev => ({ ...prev, owner: address }))
    }
  }, [address, formData.owner])
  
  // Calculate required SHAH amount
  useEffect(() => {
    if (shahPrice && paymentMethod === 'shah') {
      try {
        const usdAmount = PRICING.SHAH_USD
        const shahAmountWei = calcShahForUsd(usdAmount, shahPrice)
        setRequiredShahAmount(shahAmountWei)
      } catch (error) {
        console.error('Error calculating SHAH amount:', error)
      }
    }
  }, [shahPrice, paymentMethod])
  
  // Check for successful Stripe payment on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')
    const success = urlParams.get('success')
    
    if (sessionId && success === 'true' && address) {
      setStripeSessionId(sessionId)
      confirmStripePayment(sessionId)
    }
  }, [address])
  
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleFeatureChange = (feature: keyof TokenFeatures, checked: boolean) => {
    setFeatures(prev => ({ ...prev, [feature]: checked }))
  }
  
  const confirmStripePayment = async (sessionId: string) => {
    try {
      const response = await fetch('/api/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, walletAddress: address })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsPaymentConfirmed(true)
        toast.success('💳 Payment confirmed! You can now create your token.')
        
        // Clean up URL parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('session_id')
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.toString())
      } else {
        toast.error('❌ Payment verification failed')
      }
    } catch (error) {
      console.error('Payment confirmation error:', error)
      toast.error('❌ Failed to verify payment')
    }
  }
  
  const isFormValid = () => {
    const errors = validateTokenParams({
      ...formData,
      owner: formData.owner as `0x${string}`,
      features: getFeatureBitmap(features),
      maxSupply: features.capped ? formData.maxSupply : '0'
    })
    return errors.length === 0
  }
  
  const needsApproval = () => {
    if (paymentMethod !== 'shah' || !shahAllowance || !requiredShahAmount) return false
    return BigInt(shahAllowance.toString()) < BigInt(requiredShahAmount)
  }
  
  const hasEnoughShah = () => {
    if (paymentMethod !== 'shah' || !shahBalance || !requiredShahAmount) return true
    return BigInt(shahBalance.toString()) >= BigInt(requiredShahAmount)
  }
  
  const handleApproveShah = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    try {
      setCreateStep('approving')
      await approveShah({
        address: CONTRACTS.SHAH_TOKEN,
        abi: ERC20ABI,
        functionName: 'approve',
        args: [CONTRACTS.SHAH_FACTORY, BigInt(requiredShahAmount)]
      })
    } catch (error) {
      console.error('Approval error:', error)
      setCreateStep('idle')
      toast.error('❌ Failed to approve SHAH')
    }
  }
  
  const handleCreateToken = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!isFormValid()) {
      toast.error('Please check all form fields')
      return
    }
    
    try {
      setCreateStep('creating')
      
      const tokenArgs: TokenCreationArgs = {
        name: formData.name,
        symbol: formData.symbol,
        decimals: formData.decimals,
        initialSupply: parseUnits(formData.initialSupply, formData.decimals).toString(),
        owner: formData.owner as `0x${string}`,
        features: getFeatureBitmap(features),
        maxSupply: features.capped ? parseUnits(formData.maxSupply, formData.decimals).toString() : '0'
      }
      
      await createToken({
        address: CONTRACTS.SHAH_FACTORY,
        abi: SHAHFactoryABI,
        functionName: 'createToken',
        args: [
          tokenArgs.name,
          tokenArgs.symbol,
          tokenArgs.decimals,
          BigInt(tokenArgs.initialSupply),
          tokenArgs.owner,
          tokenArgs.features,
          BigInt(tokenArgs.maxSupply)
        ]
      })
    } catch (error) {
      console.error('Create token error:', error)
      setCreateStep('idle')
      toast.error('❌ Failed to create token')
    }
  }
  
  const handleCardPayment = async () => {
    if (!isFormValid()) {
      toast.error('Please check all form fields')
      return
    }
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PRICING.CARD_USD,
          walletAddress: address,
          tokenName: formData.name,
          tokenSymbol: formData.symbol,
          features: Object.entries(features)
            .filter(([_, enabled]) => enabled)
            .map(([feature, _]) => feature)
            .join(', ')
        })
      })
      
      const data = await response.json()
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Card payment error:', error)
      toast.error('❌ Failed to process card payment')
    }
  }
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('📋 Copied to clipboard!')
  }
  
  const copyVerificationData = () => {
    if (!createdTokenAddress) return
    
    const verificationData = generateEtherscanVerification({
      ...formData,
      owner: formData.owner as `0x${string}`,
      features: getFeatureBitmap(features),
      maxSupply: features.capped ? formData.maxSupply : '0'
    })
    
    const data = {
      contractAddress: createdTokenAddress,
      contractName: `${formData.symbol}Token`,
      ...verificationData,
      settings: {
        evmVersion: 'default',
        viaIR: false,
        licenseType: 'MIT License (MIT)',
        optimizerEnabled: true,
        runs: 200
      },
      libraries: {},
      sourceCode: `// SPDX-License-Identifier: MIT
// Token created via SHAH Factory
// Contract: ${createdTokenAddress}
// Features: ${Object.entries(features).filter(([_, enabled]) => enabled).map(([name]) => name).join(', ')}
// Created: ${new Date().toISOString()}`
    }
    
    copyToClipboard(JSON.stringify(data, null, 2))
  }
  
  if (createStep === 'success' && createdTokenAddress) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
        <div className="max-w-2xl mx-auto mt-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm border border-green-500/30 rounded-3xl p-8 text-center"
          >
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold mb-4">Token Created Successfully!</h1>
            <p className="text-gray-300 mb-8">Your new token has been deployed to Ethereum mainnet</p>
            
            <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-3">Token Address</h3>
              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                <code className="text-green-400 font-mono">{createdTokenAddress}</code>
                <button
                  onClick={() => copyToClipboard(createdTokenAddress)}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <a
                href={`https://etherscan.io/token/${createdTokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl transition-colors inline-block text-center"
              >
                📊 View on Etherscan
              </a>
              
              <a
                href={`https://etherscan.io/address/${createdTokenAddress}#code`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-xl transition-colors inline-block text-center"
              >
                🔍 View Contract Code
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={copyVerificationData}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-xl transition-colors"
              >
                📋 Copy Verification Data
              </button>
              
              <Link
                href="/factory/verify"
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-xl transition-colors inline-block text-center"
              >
                ✅ Request Verification
              </Link>
            </div>
            
            {/* Telegram Sharing */}
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-6">
              <h4 className="font-bold mb-3 text-blue-300">📢 Share Your Success!</h4>
              <p className="text-gray-300 text-sm mb-4">Let the community know about your new token</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href={`https://t.me/share/url?url=https://etherscan.io/token/${createdTokenAddress}&text=${encodeURIComponent(`🎉 Just created my own token "${formData.name}" (${formData.symbol}) on Ethereum using SHAH Factory! 🏭✨\n\nToken Address: ${createdTokenAddress}\n\nFeatures: ${Object.entries(features).filter(([_, enabled]) => enabled).map(([name]) => name).join(', ') || 'Basic'}\n\nCreate yours at https://wallet.shah.vip/factory`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl transition-colors text-center"
                >
                  📱 Share on Telegram
                </a>
                
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🎉 Just created my own token "${formData.name}" (${formData.symbol}) on Ethereum using @SHAHCoin Factory! 🏭✨\n\nToken: ${createdTokenAddress}\n\nCreate yours at https://wallet.shah.vip/factory`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl transition-colors text-center"
                >
                  🐦 Share on Twitter
                </a>
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/30 rounded-lg">
                <p className="text-xs text-blue-200">
                  💡 Pro tip: Share your token to build community and increase adoption!
                </p>
              </div>
            </div>
            
            {/* Token Details */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-sm">
              <h4 className="font-bold mb-3">Token Details</h4>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-400">Name:</span> {formData.name}</div>
                <div><span className="text-gray-400">Symbol:</span> {formData.symbol}</div>
                <div><span className="text-gray-400">Decimals:</span> {formData.decimals}</div>
                <div><span className="text-gray-400">Supply:</span> {formData.initialSupply}</div>
                <div className="col-span-2">
                  <span className="text-gray-400">Features:</span> {
                    Object.entries(features)
                      .filter(([_, enabled]) => enabled)
                      .map(([name]) => name)
                      .join(', ') || 'Basic'
                  }
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                setCreateStep('idle')
                setCreatedTokenAddress(null)
                setFormData({
                  name: '',
                  symbol: '',
                  decimals: 18,
                  initialSupply: '',
                  owner: address || '',
                  maxSupply: ''
                })
              }}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl transition-colors"
            >
              Create Another Token
            </button>
          </motion.div>
        </div>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🏭 Token Factory
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create custom ERC-20 tokens with advanced features
          </p>
        </motion.div>
        
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-6">
                Connect your wallet to start creating tokens
              </p>
              <ConnectButton />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Token Name</label>
                    <input
                      type="text"
                      placeholder="My Awesome Token"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Symbol</label>
                    <input
                      type="text"
                      placeholder="MAT"
                      value={formData.symbol}
                      onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Decimals</label>
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={formData.decimals}
                      onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Initial Supply</label>
                    <input
                      type="number"
                      placeholder="1000000"
                      value={formData.initialSupply}
                      onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Owner Address</label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => handleInputChange('owner', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                {features.capped && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Max Supply (Capped)</label>
                    <input
                      type="number"
                      placeholder="10000000"
                      value={formData.maxSupply}
                      onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
              
              {/* Features */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Token Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(features).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleFeatureChange(key as keyof TokenFeatures, e.target.checked)}
                        disabled={key === 'basic'}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="capitalize">{key}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Payment Method</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'shah'}
                      onChange={() => setPaymentMethod('shah')}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                    />
                    <span>Pay with SHAH (${PRICING.SHAH_USD})</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                    />
                    <span>Pay with Card (${PRICING.CARD_USD})</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Summary & Actions */}
            <div className="space-y-6">
              {/* Price Summary */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium">
                      {paymentMethod === 'shah' ? 'SHAH' : 'Card'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">
                      ${paymentMethod === 'shah' ? PRICING.SHAH_USD : PRICING.CARD_USD}
                    </span>
                  </div>
                  
                  {paymentMethod === 'shah' && (
                    <>
                                        <div className="flex justify-between">
                    <span>SHAH Amount:</span>
                    <span className="font-medium">
                      ~{formatUnits(BigInt(requiredShahAmount || '0'), 18)} SHAH
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>SHAH Price:</span>
                    <span className="font-medium text-yellow-400">
                      ${shahPrice.toFixed(6)} USD
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Your Balance:</span>
                    <span className={`font-medium ${hasEnoughShah() ? 'text-green-400' : 'text-red-400'}`}>
                      {formatUnits(BigInt(shahBalance?.toString() || '0'), 18)} SHAH
                    </span>
                  </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Create Button */}
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                {paymentMethod === 'shah' && !hasEnoughShah() ? (
                  <button
                    disabled
                    className="w-full bg-red-600 text-white font-bold py-3 rounded-xl opacity-50 cursor-not-allowed"
                  >
                    ❌ Insufficient SHAH Balance
                  </button>
                ) : paymentMethod === 'shah' && needsApproval() ? (
                  <button
                    onClick={handleApproveShah}
                    disabled={!isFormValid() || isApproving}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {isApproving ? '🔐 Approving...' : '🔐 Approve SHAH'}
                  </button>
                ) : paymentMethod === 'card' && !isPaymentConfirmed ? (
                  <button
                    onClick={handleCardPayment}
                    disabled={!isFormValid()}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    💳 Pay with Card ($49)
                  </button>
                ) : (
                  <button
                    onClick={handleCreateToken}
                    disabled={!isFormValid() || isCreating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    {isCreating ? '🏭 Creating...' : '🏭 Create Token'}
                  </button>
                )}
                
                {paymentMethod === 'card' && isPaymentConfirmed && (
                  <p className="text-green-400 text-sm mt-2">✅ Payment confirmed - ready to create token!</p>
                )}
                
                {!isFormValid() && (
                  <p className="text-red-400 text-sm mt-2">Please complete all required fields</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}