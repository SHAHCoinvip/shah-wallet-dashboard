'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { initializeTelegramWebApp } from '@/lib/telegram'
import Header from '@/components/Header'
import HeroCards from '@/components/HeroCards'

export default function DashboardPage() {
  const { address } = useAccount()
  const [initData, setInitData] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'swap' | 'staking' | 'nft' | 'shahcoin'>('dashboard')

  useEffect(() => {
    initializeTelegramWebApp()
    
    // Get initData from URL or Telegram WebApp
    const urlParams = new URLSearchParams(window.location.search)
    const tgInitData = urlParams.get('tgWebAppData') || ''
    setInitData(tgInitData)

    // Auto-link wallet to Telegram if connected
    if (address && tgInitData) {
      linkWalletToTelegram()
    }
  }, [address, initData])

  const linkWalletToTelegram = async () => {
    try {
      await fetch('/api/shahconnect/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: initData,
          walletAddress: address
        })
      })
    } catch (error) {
      console.error('Failed to link wallet to Telegram:', error)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'swap':
        return (
          <div className="mini-card">
            <h3 className="font-semibold text-gray-800 mb-3">Swap</h3>
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">🔄</div>
              <div>Swap functionality coming soon!</div>
            </div>
          </div>
        )
      case 'staking':
        return (
          <div className="mini-card">
            <h3 className="font-semibold text-gray-800 mb-3">Staking</h3>
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">🔒</div>
              <div>Staking functionality coming soon!</div>
            </div>
          </div>
        )
      case 'nft':
        return (
          <div className="mini-card">
            <h3 className="font-semibold text-gray-800 mb-3">NFT</h3>
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">🎨</div>
              <div>NFT functionality coming soon!</div>
            </div>
          </div>
        )
      case 'shahcoin':
        return (
          <div className="space-y-4">
            {/* SHAHCOIN Balance */}
            <div className="mini-card bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">SHAHCOIN Balance</h3>
                <div className="text-2xl">🪙</div>
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">1,250.50</div>
              <div className="text-sm text-gray-600">≈ $187.58 USD</div>
              <div className="text-xs text-green-600 mt-1">+2.5% today</div>
            </div>

            {/* Quick Actions */}
            <div className="mini-card">
              <h3 className="font-semibold text-gray-800 mb-3">SHAHCOIN Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="mini-button bg-yellow-500 hover:bg-yellow-600 text-white">
                  <span className="text-sm">Send</span>
                </button>
                <button className="mini-button bg-blue-500 hover:bg-blue-600 text-white">
                  <span className="text-sm">Receive</span>
                </button>
                <button className="mini-button bg-purple-500 hover:bg-purple-600 text-white">
                  <span className="text-sm">Stake</span>
                </button>
                <button className="mini-button bg-green-500 hover:bg-green-600 text-white">
                  <span className="text-sm">Swap</span>
                </button>
              </div>
            </div>

            {/* Staking Status */}
            <div className="mini-card">
              <h3 className="font-semibold text-gray-800 mb-3">Staking Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Staked Amount</span>
                  <span className="font-semibold text-purple-600">500.00 SHAH</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Tier</span>
                  <span className="font-semibold text-amber-600">Bronze (10% APY)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Rewards</span>
                  <span className="font-semibold text-green-600">+12.34 SHAH</span>
                </div>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Claim Rewards
                </button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="mini-card">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">Staking rewards claimed</div>
                    <div className="text-xs text-gray-500">1 hour ago</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">+8.45 SHAH</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">↔</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">SHAH/ETH swap</div>
                    <div className="text-xs text-gray-500">3 hours ago</div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">+0.25 ETH</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🔒</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">Tokens staked</div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                  <div className="text-sm font-semibold text-purple-600">+200 SHAH</div>
                </div>
              </div>
            </div>

            {/* External Links */}
            <div className="mini-card">
              <h3 className="font-semibold text-gray-800 mb-3">SHAHCOIN Tools</h3>
              <div className="space-y-2">
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => window.open('https://explorer.shahcoin.com', '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">🔍</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Block Explorer</div>
                      <div className="text-xs text-gray-500">View transactions & blocks</div>
                    </div>
                  </div>
                </button>
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => window.open('https://docs.shahcoin.com', '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">📚</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Documentation</div>
                      <div className="text-xs text-gray-500">Developer guides & API docs</div>
                    </div>
                  </div>
                </button>
                <button 
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => window.open('https://github.com/shahcoin/qt-wallet/releases', '_blank')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm">💻</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">Qt Wallet</div>
                      <div className="text-xs text-gray-500">Download desktop wallet</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <>
            {/* PRO Features Hero Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div 
                className="mini-card bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => window.location.href = '/portfolio'}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">Portfolio</div>
                </div>
                <div className="text-lg font-bold text-blue-600">$2,340</div>
                <div className="text-xs text-gray-600">Total Value</div>
              </div>

              <div 
                className="mini-card bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => window.location.href = '/referrals'}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">🎁</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">Referrals</div>
                </div>
                <div className="text-lg font-bold text-yellow-600">12</div>
                <div className="text-xs text-gray-600">Invites</div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="mini-card mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
                <button 
                  className="text-sm text-blue-600 hover:text-blue-700"
                  onClick={() => window.location.href = '/merchant'}
                >
                  View All
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">INV-ABC123</div>
                      <div className="text-xs text-gray-500">SHAH Coffee Shop</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">$25.50</div>
                    <div className="text-xs text-green-600">Paid</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-sm">⏳</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">INV-DEF456</div>
                      <div className="text-xs text-gray-500">SHAH Coffee Shop</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">$12.75</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mini-card mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="mini-button bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => setActiveTab('swap')}
                >
                  <span className="text-sm">Swap</span>
                </button>
                <button 
                  className="mini-button bg-purple-500 hover:bg-purple-600 text-white"
                  onClick={() => setActiveTab('staking')}
                >
                  <span className="text-sm">Stake</span>
                </button>
                <button 
                  className="mini-button bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => window.location.href = '/merchant'}
                >
                  <span className="text-sm">Create Invoice</span>
                </button>
                <button 
                  className="mini-button bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => window.location.href = '/referrals'}
                >
                  <span className="text-sm">Invite & Earn</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mini-card">
              <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">Staking rewards claimed</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">+45.2 SHAH</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">↔</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">SHAH/ETH swap</div>
                    <div className="text-xs text-gray-500">1 day ago</div>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">+0.5 ETH</div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🎁</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">Referral bonus earned</div>
                    <div className="text-xs text-gray-500">3 days ago</div>
                  </div>
                  <div className="text-sm font-semibold text-purple-600">+5.0 SHAH</div>
                </div>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="mini-app-container">
      <Header />
      
      <div className="mb-6">
        <HeroCards />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
          { id: 'swap', label: 'Swap', icon: '🔄' },
          { id: 'staking', label: 'Staking', icon: '🔒' },
          { id: 'nft', label: 'NFT', icon: '🎨' },
          { id: 'shahcoin', label: 'SHAHCOIN', icon: '🪙' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {renderContent()}
    </div>
  )
} 