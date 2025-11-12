'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sprout, TrendingUp } from 'lucide-react'

export default function FarmingPage() {
  const { isConnected } = useAccount()
  const [pageError] = useState<string | null>(null)

  const pools = [
    {
      name: 'SHAH / ETH',
      apy: '124% APY',
      tvl: '$2.4M TVL',
      rewards: '45.2 SHAH',
      tokens: ['SHAH', 'ETH'],
      isFeatured: true,
    },
    {
      name: 'SHAH / USDT',
      apy: '86% APY',
      tvl: '$1.8M TVL',
      rewards: '—',
      tokens: ['SHAH', 'USDT'],
      isFeatured: false,
    },
    {
      name: 'SHAH / DAI',
      apy: '72% APY',
      tvl: '$980K TVL',
      rewards: '12.3 SHAH',
      tokens: ['SHAH', 'DAI'],
      isFeatured: false,
    },
  ]

  if (!isConnected) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Farming</h1>
            <p className="page-subtitle">Earn SHAH rewards by providing premium liquidity</p>
          </div>
        </div>

        <section className="card card-glass text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.18)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Sprout className="w-8 h-8" color="var(--gold)" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
            Connect your wallet to unlock liquidity pool rewards
          </p>
          <ConnectButton />
        </section>
      </>
    )
  }

  if (pageError) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1 className="page-title">Farming</h1>
            <p className="page-subtitle">Earn SHAH rewards by providing premium liquidity</p>
          </div>
        </div>

        <section className="card card-glass text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-red-500/20" style={{ border: '1px solid rgba(231, 76, 60, 0.45)' }}>
            <span className="text-2xl" role="img" aria-label="alert">
              ⚠️
            </span>
          </div>
          <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--error-red)' }}>
            Farming Temporarily Unavailable
          </h2>
          <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
            {pageError}
          </p>
          <button className="btn-gold" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </section>
      </>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Farming</h1>
          <p className="page-subtitle">Earn SHAH rewards by providing premium liquidity</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card card-glass">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Value Locked</p>
          <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            $5.2M
          </p>
        </div>
        <div className="card card-glass">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your Liquidity</p>
          <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            $0.00
          </p>
        </div>
        <div className="card card-glass">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Earned Rewards</p>
          <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--success-green)' }}>
            0 SHAH
          </p>
        </div>
        <div className="card card-glass">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Pools</p>
          <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            3
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Active Liquidity Pools
        </h2>
        <p className="page-subtitle" style={{ marginTop: '0.25rem' }}>
          Stake LP tokens to accumulate SHAH rewards with high-yield APYs
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {pools.map((pool) => (
            <div key={pool.name} className="card card-glass">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {pool.tokens.map((token, index) => (
                      <div
                        key={token}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)]"
                        style={{
                          background:
                            index === 0 ? 'var(--gold-gradient)' : index === 1 ? 'linear-gradient(135deg, #3B82F6, #60A5FA)' : 'rgba(255,255,255,0.08)',
                          color: index === 0 ? '#0A0A0A' : '#ffffff',
                        }}
                      >
                        <span className="text-xs font-semibold">{token}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {pool.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Liquidity Pool
                    </p>
                  </div>
                </div>
                {pool.isFeatured && (
                  <span className="badge" style={{ background: 'rgba(212, 175, 55, 0.18)', color: 'var(--gold)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    Featured
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <p className="text-xs">APY</p>
                  <p className="mt-1 flex items-center gap-1 text-base font-semibold" style={{ color: 'var(--success-green)' }}>
                    <TrendingUp className="h-4 w-4" />
                    {pool.apy}
                  </p>
                </div>
                <div>
                  <p className="text-xs">TVL</p>
                  <p className="mt-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {pool.tvl}
                  </p>
                </div>
                <div>
                  <p className="text-xs">Rewards</p>
                  <p className="mt-1 text-base font-semibold" style={{ color: pool.rewards === '—' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {pool.rewards === '—' ? 'Pending' : pool.rewards}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {pool.rewards === '—' ? (
                  <button className="btn-outline flex-1">Add Liquidity</button>
                ) : (
                  <>
                    <button className="btn-gold flex-1">Claim Rewards</button>
                    <button className="btn-outline">Deposit</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-glass">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--accent-blue)' }}>
          💡 How Farming Works
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Provide liquidity to SHAH trading pairs, stake the corresponding LP tokens, and earn SHAH rewards continuously. Featured pools receive boosted APYs and seasonal multipliers.
        </p>
      </section>
    </>
  )
}
