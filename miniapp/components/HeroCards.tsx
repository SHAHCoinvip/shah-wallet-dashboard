'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { getSHAHBalance, getStakingInfo, CONTRACTS } from '@/lib/viem'
import { triggerHapticFeedback } from '@/lib/telegram'
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  FireIcon,
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline'

interface HeroCardsProps {
  onNavigate: (route: string) => void
}

export default function HeroCards({ onNavigate }: HeroCardsProps) {
  const { address, isConnected } = useAccount()
  const [shahBalance, setShahBalance] = useState<string>('0')
  const [stakingInfo, setStakingInfo] = useState({
    stakedBalance: '0',
    pendingRewards: '0',
    currentTier: 0,
  })
  const [loading, setLoading] = useState(true)

  const { data: ethBalance } = useBalance({
    address,
    watch: true,
  })

  useEffect(() => {
    if (isConnected && address) {
      loadBalances()
    } else {
      setLoading(false)
    }
  }, [isConnected, address])

  const loadBalances = async () => {
    try {
      setLoading(true)
      const [shahBal, stakingData] = await Promise.all([
        getSHAHBalance(address as `0x${string}`),
        getStakingInfo(address as `0x${string}`),
      ])

      setShahBalance(formatEther(shahBal))
      setStakingInfo({
        stakedBalance: formatEther(stakingData.stakedBalance),
        pendingRewards: formatEther(stakingData.pendingRewards),
        currentTier: stakingData.currentTier,
      })
    } catch (error) {
      console.error('Error loading balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardPress = (route: string) => {
    triggerHapticFeedback('light')
    onNavigate(route)
  }

  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1:
        return { name: 'Bronze', apy: '10%', color: 'from-amber-500 to-orange-500' }
      case 2:
        return { name: 'Silver', apy: '15%', color: 'from-gray-400 to-gray-600' }
      case 3:
        return { name: 'Gold', apy: '20%', color: 'from-yellow-500 to-yellow-600' }
      default:
        return { name: 'None', apy: '0%', color: 'from-gray-500 to-gray-700' }
    }
  }

  const tierInfo = getTierInfo(stakingInfo.currentTier)

  return (
    <div className="space-y-4">
      {/* SHAH Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCardPress('/swap')}
        className="mini-card cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">SHAH Balance</h3>
              <p className="text-xl font-bold">
                {loading ? (
                  <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${parseFloat(shahBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} SHAH`
                )}
              </p>
            </div>
          </div>
          <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>

      {/* ETH Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCardPress('/swap')}
        className="mini-card cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">ETH Balance</h3>
              <p className="text-xl font-bold">
                {ethBalance ? (
                  `${parseFloat(ethBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH`
                ) : (
                  <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
                )}
              </p>
            </div>
          </div>
          <ArrowTrendingUpIcon className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>

      {/* Staking Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleCardPress('/staking')}
        className="mini-card cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${tierInfo.color} rounded-lg flex items-center justify-center`}>
              <FireIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-300">Staking</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold">
                  {loading ? (
                    <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    `${parseFloat(stakingInfo.stakedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })} SHAH`
                  )}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{tierInfo.name} Tier</span>
                  <span className="text-xs font-medium text-green-400">{tierInfo.apy} APY</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-green-400">
              {loading ? (
                <div className="h-4 w-12 bg-gray-700 rounded animate-pulse"></div>
              ) : (
                `+${parseFloat(stakingInfo.pendingRewards).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              )}
            </p>
            <p className="text-xs text-gray-400">Rewards</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCardPress('/swap')}
          className="mini-card cursor-pointer text-center"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium">Swap</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCardPress('/nft')}
          className="mini-card cursor-pointer text-center"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FireIcon className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-medium">NFTs</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCardPress('/shahcoin')}
          className="mini-card cursor-pointer text-center"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CurrencyDollarIcon className="w-5 h-5 text-black" />
          </div>
          <p className="text-sm font-medium">Shahcoin</p>
        </motion.button>
      </motion.div>
    </div>
  )
} 