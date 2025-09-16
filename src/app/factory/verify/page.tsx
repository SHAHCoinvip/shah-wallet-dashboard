'use client'

import { useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { CONTRACTS, PRICING } from '@/lib/factory'
import { VerifiedTokenRegistryABI } from '@/abi/VerifiedTokenRegistry'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { ERC20ABI } from '@/abi/ERC20'

export default function VerifyPage() {
  const { address, isConnected } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Contract reads
  const { data: shahPrice } = useReadContract({
    address: CONTRACTS.SHAH_PRICE_ORACLE,
    abi: SHAHPriceOracleABI,
    functionName: 'getPriceInUSD',
  })
  
  const { data: verificationFee } = useReadContract({
    address: CONTRACTS.SHAH_REGISTRY,
    abi: VerifiedTokenRegistryABI,
    functionName: 'getVerificationFeeInSHAH',
  })
  
  const { data: shahBalance } = useReadContract({
    address: CONTRACTS.SHAH_TOKEN,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }
  })
  
  const { data: isAlreadyVerified } = useReadContract({
    address: CONTRACTS.SHAH_REGISTRY,
    abi: VerifiedTokenRegistryABI,
    functionName: 'isVerified',
    args: [tokenAddress as `0x${string}`],
    query: { enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress) }
  })
  
  // Contract writes
  const { writeContract: requestVerification, data: verificationHash } = useWriteContract()
  
  // Transaction receipt
  const { isLoading: isProcessing } = useWaitForTransactionReceipt({
    hash: verificationHash,
    onSuccess: () => {
      toast.success('✅ Verification request submitted!')
      setIsSubmitting(false)
      setTokenAddress('')
    },
    onError: () => {
      toast.error('❌ Verification request failed')
      setIsSubmitting(false)
    }
  })
  
  const handleSubmitVerification = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
      toast.error('Please enter a valid token address')
      return
    }
    
    if (isAlreadyVerified) {
      toast.error('This token is already verified')
      return
    }
    
    if (!verificationFee || !shahBalance) {
      toast.error('Unable to check SHAH balance')
      return
    }
    
    if (BigInt(shahBalance.toString()) < BigInt(verificationFee.toString())) {
      toast.error('Insufficient SHAH balance for verification fee')
      return
    }
    
    try {
      setIsSubmitting(true)
      await requestVerification({
        address: CONTRACTS.SHAH_REGISTRY,
        abi: VerifiedTokenRegistryABI,
        functionName: 'requestVerification',
        args: [tokenAddress as `0x${string}`]
      })
    } catch (error) {
      console.error('Verification request error:', error)
      setIsSubmitting(false)
      toast.error('❌ Failed to submit verification request')
    }
  }
  
  const getRequiredShahAmount = () => {
    if (!shahPrice) return '0'
    try {
      const priceInUsd = Number(formatUnits(BigInt(shahPrice.toString()), 8))
      const shahAmount = PRICING.VERIFICATION_USD / priceInUsd
      return shahAmount.toFixed(2)
    } catch (error) {
      return '0'
    }
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            ✅ Token Verification
          </h1>
          <p className="text-xl text-gray-300">
            Get your token verified by SHAH for enhanced trust and visibility
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
                Connect your wallet to request token verification
              </p>
              <ConnectButton />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-2xl font-bold mb-4">How Verification Works</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <h4 className="font-bold mb-1">Submit Request</h4>
                  <p className="text-sm text-gray-400">Provide token address and pay SHAH fee</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <h4 className="font-bold mb-1">Admin Review</h4>
                  <p className="text-sm text-gray-400">Our team reviews your token for legitimacy</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h4 className="font-bold mb-1">Get Verified</h4>
                  <p className="text-sm text-gray-400">Approved tokens get the verified badge</p>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-bold mb-2">✨ Benefits of Verification</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Trusted badge displayed across all SHAH platforms</li>
                  <li>• Higher visibility in token listings</li>
                  <li>• Enhanced user confidence and adoption</li>
                  <li>• Protection against impersonation</li>
                </ul>
              </div>
            </motion.div>
            
            {/* Verification Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-2xl font-bold mb-4">Request Verification</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Token Contract Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-green-500"
                  />
                  {tokenAddress && isAlreadyVerified && (
                    <p className="text-green-400 text-sm mt-1">✅ This token is already verified</p>
                  )}
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="font-bold mb-2">🏷️ Verification Fee</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Fee (USD):</span>
                      <span className="font-medium">${PRICING.VERIFICATION_USD}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fee (SHAH):</span>
                      <span className="font-medium">~{getRequiredShahAmount()} SHAH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your Balance:</span>
                      <span className={`font-medium ${
                        shahBalance && verificationFee && BigInt(shahBalance.toString()) >= BigInt(verificationFee.toString()) 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        {formatUnits(BigInt(shahBalance?.toString() || '0'), 18)} SHAH
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmitVerification}
                  disabled={
                    !tokenAddress || 
                    !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) || 
                    isAlreadyVerified ||
                    isSubmitting ||
                    isProcessing ||
                    !shahBalance ||
                    !verificationFee ||
                    BigInt(shahBalance.toString()) < BigInt(verificationFee.toString())
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {isSubmitting || isProcessing ? '⏳ Submitting...' : '✅ Submit Verification Request'}
                </button>
                
                {tokenAddress && !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress) && (
                  <p className="text-red-400 text-sm">Please enter a valid Ethereum address</p>
                )}
              </div>
            </motion.div>
            
            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-xl font-bold mb-4">📋 Verification Criteria</h3>
              
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Token contract must be verified on Etherscan</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Token must have legitimate utility and purpose</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>No malicious code or backdoors detected</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Team and project information publicly available</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-400">✓</span>
                  <span>Active community and development</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Note:</strong> Verification fees are non-refundable. Review takes 3-7 business days. 
                  You will be notified via your connected wallet address.
                </p>
              </div>
            </motion.div>
            
            {/* Back to Factory */}
            <div className="text-center">
              <Link
                href="/factory"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>←</span>
                <span>Back to Token Factory</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}