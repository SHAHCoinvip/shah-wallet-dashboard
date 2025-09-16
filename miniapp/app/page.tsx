'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import Header from '@/components/Header'
import HeroCards from '@/components/HeroCards'
import { initializeTelegramWebApp, triggerHapticFeedback } from '@/lib/telegram'
import { toast } from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [currentRoute, setCurrentRoute] = useState('/')
  const [telegramInitialized, setTelegramInitialized] = useState(false)

  useEffect(() => {
    // Initialize Telegram WebApp
    const initResult = initializeTelegramWebApp()
    if (initResult) {
      setTelegramInitialized(true)
      console.log('Telegram WebApp initialized:', initResult)
    }
  }, [])

  useEffect(() => {
    // Auto-link wallet to Telegram when connected
    if (isConnected && address && telegramInitialized) {
      linkWalletToTelegram()
    }
  }, [isConnected, address, telegramInitialized])

  const linkWalletToTelegram = async () => {
    try {
      const webApp = window.Telegram?.WebApp
      if (!webApp) return

      const response = await fetch('/api/shahconnect/link-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: webApp.initData,
          walletAddress: address,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Wallet linked to Telegram!')
        triggerHapticFeedback('success')
      }
    } catch (error) {
      console.error('Error linking wallet:', error)
    }
  }

  const handleNavigate = (route: string) => {
    setCurrentRoute(route)
    triggerHapticFeedback('light')
  }

  const renderContent = () => {
    switch (currentRoute) {
      case '/':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold mb-2">
                Welcome to SHAH Wallet
              </h2>
              <p className="text-gray-400">
                {isConnected 
                  ? 'Your wallet is connected and ready!'
                  : 'Connect your wallet to get started'
                }
              </p>
            </motion.div>

            {/* Hero Cards */}
            <HeroCards onNavigate={handleNavigate} />

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mini-card"
            >
              <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">$0.000123</p>
                  <p className="text-xs text-gray-400">SHAH Price</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">+5.2%</p>
                  <p className="text-xs text-gray-400">24h Change</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mini-card"
            >
              <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-green-500 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Wallet Connected</p>
                      <p className="text-xs text-gray-400">Just now</p>
                    </div>
                  </div>
                </div>
                {isConnected && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-500 text-sm">🔗</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Telegram Linked</p>
                        <p className="text-xs text-gray-400">Just now</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )

      case '/swap':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Token Swap</h2>
              <p className="text-gray-400">Trade tokens on ShahSwap DEX V3</p>
            </div>

            {/* Swap Interface */}
            <div className="mini-card">
              <div className="space-y-4">
                {/* From Token */}
                <div>
                  <label className="block text-sm font-medium mb-2">From</label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">S</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="0.0"
                        className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">SHAH</p>
                      <p className="text-xs text-gray-400">Balance: 0</p>
                    </div>
                  </div>
                </div>

                {/* Swap Arrow */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white">⇅</span>
                  </motion.button>
                </div>

                {/* To Token */}
                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">$</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="0.0"
                        className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
                        readOnly
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">USDT</p>
                      <p className="text-xs text-gray-400">Balance: 0</p>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold"
                >
                  {isConnected ? 'Swap Tokens' : 'Connect Wallet to Swap'}
                </motion.button>
              </div>
            </div>

            {/* Available Pairs */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Available Pairs</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">SHAH</span>
                    <span>/</span>
                    <span className="text-green-500">USDT</span>
                  </div>
                  <span className="text-sm text-gray-400">$0.000123</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">SHAH</span>
                    <span>/</span>
                    <span className="text-blue-500">WETH</span>
                  </div>
                  <span className="text-sm text-gray-400">0.0000002 ETH</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">SHAH</span>
                    <span>/</span>
                    <span className="text-orange-500">DAI</span>
                  </div>
                  <span className="text-sm text-gray-400">$0.000123</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/')}
              className="w-full py-2 bg-gray-700 rounded-lg"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )

      case '/staking':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">SHAH Staking</h2>
              <p className="text-gray-400">Stake SHAH tokens and earn rewards</p>
            </div>

            {/* Staking Stats */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Your Staking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">0 SHAH</p>
                  <p className="text-xs text-gray-400">Staked</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">0 SHAH</p>
                  <p className="text-xs text-gray-400">Pending Rewards</p>
                </div>
              </div>
            </div>

            {/* Staking Interface */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Stake SHAH</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount to Stake</label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">S</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="0.0"
                        className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">SHAH</p>
                      <p className="text-xs text-gray-400">Balance: 0</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg font-semibold"
                >
                  {isConnected ? 'Stake SHAH' : 'Connect Wallet to Stake'}
                </motion.button>
              </div>
            </div>

            {/* Staking Tiers */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Staking Tiers</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <p className="font-medium">Bronze Tier</p>
                    <p className="text-xs text-gray-400">0-1,000 SHAH</p>
                  </div>
                  <span className="text-green-500 font-semibold">5% APY</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <p className="font-medium">Silver Tier</p>
                    <p className="text-xs text-gray-400">1,000-10,000 SHAH</p>
                  </div>
                  <span className="text-blue-500 font-semibold">8% APY</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                  <div>
                    <p className="font-medium">Gold Tier</p>
                    <p className="text-xs text-gray-400">10,000+ SHAH</p>
                  </div>
                  <span className="text-yellow-500 font-semibold">12% APY</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/')}
              className="w-full py-2 bg-gray-700 rounded-lg"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )

      case '/nft':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">SHAH NFTs</h2>
              <p className="text-gray-400">Collect and trade SHAH ecosystem NFTs</p>
            </div>

            {/* NFT Stats */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Your Collection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">0</p>
                  <p className="text-xs text-gray-400">Owned NFTs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">0</p>
                  <p className="text-xs text-gray-400">Listed for Sale</p>
                </div>
              </div>
            </div>

            {/* Featured NFTs */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Featured NFTs</h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 rounded-lg p-3 cursor-pointer"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">#1</span>
                  </div>
                  <p className="text-sm font-medium">SHAH Genesis</p>
                  <p className="text-xs text-gray-400">0.1 ETH</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 rounded-lg p-3 cursor-pointer"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">#2</span>
                  </div>
                  <p className="text-sm font-medium">SHAH Legend</p>
                  <p className="text-xs text-gray-400">0.15 ETH</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 rounded-lg p-3 cursor-pointer"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">#3</span>
                  </div>
                  <p className="text-sm font-medium">SHAH Royal</p>
                  <p className="text-xs text-gray-400">0.2 ETH</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-800/50 rounded-lg p-3 cursor-pointer"
                >
                  <div className="w-full h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded mb-2 flex items-center justify-center">
                    <span className="text-white font-bold">#4</span>
                  </div>
                  <p className="text-sm font-medium">SHAH Elite</p>
                  <p className="text-xs text-gray-400">0.25 ETH</p>
                </motion.div>
              </div>
            </div>

            {/* NFT Actions */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-semibold"
                >
                  Browse Marketplace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg font-semibold"
                >
                  Create NFT
                </motion.button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/')}
              className="w-full py-2 bg-gray-700 rounded-lg"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )

      case '/shahcoin':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Hero */}
            <div className="mini-card text-center p-8 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-pink-500/10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                <span className="text-black font-bold text-xl">S</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">SHAHCOIN CORE</h2>
              <p className="text-gray-400">Decentralized. Scalable. Community Driven.</p>
            </div>

            {/* Qt Wallet Downloads */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Download Qt Wallet</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a className="mini-button text-center" href="https://github.com/shahcoin/releases/windows" target="_blank" rel="noopener noreferrer">Windows</a>
                <a className="mini-button text-center" href="https://github.com/shahcoin/releases/macos" target="_blank" rel="noopener noreferrer">macOS</a>
                <a className="mini-button text-center" href="https://github.com/shahcoin/releases/linux" target="_blank" rel="noopener noreferrer">Linux</a>
              </div>
            </div>

            {/* SDK Showcase */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-2">Developer SDK</h3>
              <p className="text-gray-400 mb-3">Build on Shahcoin with our developer SDK to create apps, integrations, and tools.</p>
              <a className="mini-button" href="https://github.com/shahcoin/docs" target="_blank" rel="noopener noreferrer">Read Developer Docs</a>
            </div>

            {/* Explorer */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-2">Explorer</h3>
              <a className="mini-button" href="https://scan.shahcoin.net" target="_blank" rel="noopener noreferrer">Open ShahScan Explorer</a>
            </div>

            {/* Features Grid */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Chain Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Block Time</p>
                  <p className="text-base font-semibold">150 sec</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Consensus</p>
                  <p className="text-base font-semibold">Multi-algo PoW (Scrypt + Groestl planned)</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Halving</p>
                  <p className="text-base font-semibold">Standard halving schedule</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">Security</p>
                  <p className="text-base font-semibold">Max reorg depth, miner whitelist, replay protection</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-800/50">
                  <p className="text-xs text-gray-400">PoS</p>
                  <p className="text-base font-semibold">Future roadmap</p>
                </div>
              </div>
            </div>

            {/* Get Started CTA */}
            <div className="mini-card">
              <h3 className="text-lg font-semibold mb-3">Get Started</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a className="mini-button text-center" href="https://github.com/shahcoin/releases" target="_blank" rel="noopener noreferrer">Download Wallet</a>
                <a className="mini-button text-center" href="https://scan.shahcoin.net" target="_blank" rel="noopener noreferrer">View Explorer</a>
                <a className="mini-button text-center" href="https://github.com/shahcoin/docs" target="_blank" rel="noopener noreferrer">Read Docs</a>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/')}
              className="w-full py-2 bg-gray-700 rounded-lg"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )

      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleNavigate('/')}
              className="mini-button"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )
    }
  }

  return (
    <div className="mini-app-container">
      <Header />
      
      <main className="pt-4">
        {renderContent()}
      </main>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  )
} 