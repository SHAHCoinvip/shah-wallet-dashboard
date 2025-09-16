'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getTelegramWebApp } from '@/lib/telegram'
import WalletSwitcher from './WalletSwitcher'

export default function Header() {
  const [telegramUser, setTelegramUser] = useState<any>(null)

  useEffect(() => {
    const webApp = getTelegramWebApp()
    if (webApp?.initDataUnsafe?.user) {
      setTelegramUser(webApp.initDataUnsafe.user)
    }
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 glass-dark backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
              SHAH Wallet
            </h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">ETH Mainnet</span>
            </div>
          </div>
        </div>

        {/* Right side - Telegram user and wallet */}
        <div className="flex items-center space-x-3">
          {/* Telegram user avatar */}
          {telegramUser?.photo_url && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-500"
            >
              <img
                src={telegramUser.photo_url}
                alt={telegramUser.first_name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Wallet Switcher */}
          <WalletSwitcher />
        </div>
      </div>
    </motion.header>
  )
} 