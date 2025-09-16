'use client'

import { motion } from 'framer-motion'
import { AdminStats, formatNumber, formatTokenAmount } from '@/lib/admin'

interface AdminCardsProps {
  stats: AdminStats | null
  loading: boolean
}

export default function AdminCards({ stats, loading }: AdminCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: 'bg-blue-600',
      format: 'number'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: '🟢',
      color: 'bg-green-600',
      format: 'number'
    },
    {
      title: 'Premium Users',
      value: stats?.premiumUsers || 0,
      icon: '💎',
      color: 'bg-purple-600',
      format: 'number'
    },
    {
      title: 'Tokens Created',
      value: stats?.tokensCreated || 0,
      icon: '🏭',
      color: 'bg-yellow-600',
      format: 'number'
    },
    {
      title: 'Total Staked',
      value: stats?.totalStaked || '0',
      icon: '🪙',
      color: 'bg-orange-600',
      format: 'token',
      suffix: 'SHAH'
    },
    {
      title: 'NFTs Minted',
      value: stats?.nftsMinted || 0,
      icon: '🎨',
      color: 'bg-pink-600',
      format: 'number'
    },
    {
      title: 'Swap Volume',
      value: stats?.swapVolume || '0',
      icon: '📊',
      color: 'bg-indigo-600',
      format: 'token',
      suffix: 'ETH'
    }
  ]

  const formatValue = (value: any, format: string, suffix?: string) => {
    if (loading) return '...'
    
    let formatted = ''
    
    switch (format) {
      case 'number':
        formatted = formatNumber(value)
        break
      case 'token':
        formatted = formatTokenAmount(value.toString())
        break
      default:
        formatted = value.toString()
    }
    
    return suffix ? `${formatted} ${suffix}` : formatted
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {formatValue(card.value, card.format, card.suffix)}
              </div>
              <div className="text-sm text-gray-400">{card.title}</div>
            </div>
          </div>
          
          {/* Progress indicator (mock) */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: loading ? '50%' : '75%' }}
              transition={{ delay: (index * 0.1) + 0.5, duration: 1 }}
              className={`h-2 ${card.color} rounded-full`}
            />
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            {loading ? 'Loading...' : '24h change: +12%'}
          </div>
        </motion.div>
      ))}
    </div>
  )
}