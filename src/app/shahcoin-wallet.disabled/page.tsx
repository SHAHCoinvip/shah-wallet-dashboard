'use client'

import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ShahcoinWalletPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🪙 SHAHCOIN Blockchain Wallet
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Native Layer 1 blockchain wallet for SHAHCOIN ecosystem
          </p>
        </motion.div>

        {/* Coming Soon Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-12 mb-8"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="text-6xl mb-6"
            >
              ⚡
            </motion.div>
            <h2 className="text-3xl font-bold mb-4 text-purple-300">
              Coming Soon
            </h2>
            <p className="text-lg text-gray-300 mb-6 max-w-md mx-auto">
              We're finalizing the SHAHCOIN blockchain mainnet. This wallet will support native SHAHCOIN layer 1 balances and transfers.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="bg-gray-700 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Development Progress: 75%</p>
            </div>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-4">💎</div>
            <h3 className="text-xl font-bold mb-2">Native SHAHCOIN</h3>
            <p className="text-gray-400">Direct layer 1 blockchain integration for instant transactions</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">High Performance</h3>
            <p className="text-gray-400">Lightning-fast transactions with minimal gas fees</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="text-3xl mb-4">🔗</div>
            <h3 className="text-xl font-bold mb-2">Cross-Chain Bridge</h3>
            <p className="text-gray-400">Seamless bridging between Ethereum and SHAHCOIN networks</p>
          </div>
        </motion.div>

        {/* Connect Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Get Ready for SHAHCOIN</h3>
            <p className="text-gray-300 mb-6">
              Connect your wallet to be notified when SHAHCOIN mainnet launches
            </p>
            <ConnectButton />
          </div>
        </motion.div>

        {/* Status Updates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-green-900/20 border border-green-500/30 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Development in Progress</span>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 