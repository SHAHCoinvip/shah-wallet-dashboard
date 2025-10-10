'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'

export default function FarmingPage() {
  const { address, isConnected } = useAccount()
  const [pageError, setPageError] = useState<string | null>(null)

  // Show fallback if there's an error or not connected
  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-gold)' }}>Farming</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>SHAH Token Farming Dashboard</p>
        </div>
        
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: 'var(--color-gold)' }}>
            <span className="text-black font-bold text-2xl">🌾</span>
          </div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>Connect Your Wallet</h2>
          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>Connect your wallet to start farming SHAH tokens</p>
          <button className="btn-gold">
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  // Try to load farming data, show fallback on error
  try {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-gold)' }}>Farming</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>SHAH Token Farming Dashboard</p>
        </div>

        {/* Portfolio Summary */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-gold)' }}>Your Farming Portfolio</h2>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-gold)' }}>$0.00</p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>Total Staked Value</p>
            </div>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl" style={{ backgroundColor: 'var(--color-gold)' }}>
              <span className="text-black font-bold text-3xl">🌾</span>
            </div>
          </div>
        </div>

        {/* Farming Pools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>SHAH/ETH Pool</h3>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-gold)' }}>12.5% APY</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Stake SHAH/ETH LP tokens</p>
              <button className="btn-gold w-full">
                Stake Now
              </button>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>SHAH/USDT Pool</h3>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-gold)' }}>10.8% APY</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Stake SHAH/USDT LP tokens</p>
              <button className="btn-gold w-full">
                Stake Now
              </button>
            </div>
          </div>

          <div className="card">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>SHAH/DAI Pool</h3>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--color-gold)' }}>9.2% APY</p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Stake SHAH/DAI LP tokens</p>
              <button className="btn-gold w-full">
                Stake Now
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button className="btn-outline">
            View All Pools
          </button>
          <button className="btn-gold">
            Create New Pool
          </button>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-gold)' }}>Farming</h1>
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>SHAH Token Farming Dashboard</p>
        </div>
        
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl bg-red-500">
            <span className="text-white font-bold text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>Farming Temporarily Unavailable</h2>
          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>Please refresh or reconnect your wallet to continue.</p>
          <button className="btn-gold" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}