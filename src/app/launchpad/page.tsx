'use client'

import { useState, useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { getDropsByStatus, getLaunchpadStats, LaunchpadDrop, LaunchpadStats } from '@/lib/launchpad'
import DropCard from '@/components/DropCard'

type TabType = 'upcoming' | 'live' | 'archived'

export default function LaunchpadPage() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('live')
  const [drops, setDrops] = useState<LaunchpadDrop[]>([])
  const [stats, setStats] = useState<LaunchpadStats | null>(null)
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: '🚀' },
    { id: 'live', label: 'Live', icon: '🔥' },
    { id: 'archived', label: 'Archived', icon: '📚' }
  ] as const

  // Load drops and stats
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [dropsData, statsData] = await Promise.all([
        getDropsByStatus(activeTab === 'archived' ? 'ended' : activeTab),
        getLaunchpadStats()
      ])
      
      setDrops(dropsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading launchpad data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
              <div className="h-48 bg-gray-700"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (drops.length === 0) {
      const emptyStateConfig = {
        upcoming: {
          icon: '🚀',
          title: 'No Upcoming Drops',
          subtitle: 'New drops are being prepared. Check back soon!'
        },
        live: {
          icon: '🔥',
          title: 'No Live Drops',
          subtitle: 'All current drops have ended. Watch for new launches!'
        },
        archived: {
          icon: '📚',
          title: 'No Archived Drops',
          subtitle: 'Past drops will appear here once available.'
        }
      }

      const config = emptyStateConfig[activeTab]

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="text-8xl mb-6">{config.icon}</div>
          <h3 className="text-2xl font-bold mb-4">{config.title}</h3>
          <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
            {config.subtitle}
          </p>
          {activeTab === 'upcoming' && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6 max-w-sm mx-auto">
              <div className="text-sm text-purple-300 mb-2">Coming Soon</div>
              <div className="text-lg font-bold text-white">SHAH Partner Collections</div>
              <div className="text-sm text-gray-400 mt-1">Exclusive NFT partnerships</div>
            </div>
          )}
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {drops.map((drop, index) => (
          <DropCard 
            key={drop.id} 
            drop={drop}
            className=""
          />
        ))}
      </motion.div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto mt-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎨 SHAH NFT Launchpad
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Discover and mint exclusive NFT collections from verified partners. Pay with SHAH tokens for special discounts!
          </p>

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8"
            >
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">{stats.totalDrops}</div>
                <div className="text-sm text-gray-400">Total Drops</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{stats.liveDrops}</div>
                <div className="text-sm text-gray-400">Live Now</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">${stats.totalRaised.toFixed(0)}K</div>
                <div className="text-sm text-gray-400">Total Raised</div>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{stats.totalParticipants}</div>
                <div className="text-sm text-gray-400">Participants</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Connect Wallet Banner */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 mb-8 text-center"
          >
            <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-gray-300 mb-4">Connect your Web3 wallet to participate in NFT drops and access exclusive features</p>
            <ConnectButton />
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-2">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          {renderTabContent()}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold mb-2">Curated Collections</h3>
            <p className="text-gray-400">Hand-picked NFT projects from verified partners with strong communities and roadmaps.</p>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🪙</div>
            <h3 className="text-xl font-bold mb-2">SHAH Token Benefits</h3>
            <p className="text-gray-400">Get exclusive discounts and early access when paying with SHAH tokens.</p>
          </div>
          
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Secure & Verified</h3>
            <p className="text-gray-400">All contracts are audited and partners are thoroughly vetted for security and legitimacy.</p>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Want to Launch Your Collection?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Partner with SHAH Launchpad to reach thousands of collectors and investors. Get access to our curated audience and marketing support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:partnerships@shah.vip"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                📧 Contact Partnerships
              </a>
              <a
                href="/factory"
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                🏭 Create Your Token
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}