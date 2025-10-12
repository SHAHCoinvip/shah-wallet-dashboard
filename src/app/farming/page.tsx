'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sprout, TrendingUp } from 'lucide-react'

export default function FarmingPage() {
  const { address, isConnected } = useAccount()
  const [pageError, setPageError] = useState<string | null>(null)

  const pools = [
    {
      name: 'SHAH-ETH',
      apy: '124%',
      tvl: '$2.4M',
      rewards: '45.2 SHAH',
      tokens: ['SHAH', 'ETH'],
      isFeatured: true,
    },
    {
      name: 'SHAH-USDT',
      apy: '86%',
      tvl: '$1.8M',
      rewards: '0',
      tokens: ['SHAH', 'USDT'],
      isFeatured: false,
    },
    {
      name: 'SHAH-DAI',
      apy: '72%',
      tvl: '$980K',
      rewards: '12.3 SHAH',
      tokens: ['SHAH', 'DAI'],
      isFeatured: false,
    },
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Farming</h1>
          <p style={{ color: '#A1A1AA' }}>Earn rewards by providing liquidity</p>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Sprout className="w-10 h-10" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>Connect your wallet to start farming</p>
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Farming</h1>
          <p style={{ color: '#A1A1AA' }}>Earn rewards by providing liquidity</p>
        </div>
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-2xl bg-red-600">
              <span className="text-white font-bold text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-red-500">Farming Unavailable</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>{pageError}</p>
            <button className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }} onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Farming</h1>
        <p style={{ color: '#A1A1AA' }}>Earn rewards by providing liquidity</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Total Value Locked</div>
          <div className="text-2xl font-bold" style={{ color: '#F1F1F1' }}>$5.2M</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Your Liquidity</div>
          <div className="text-2xl font-bold" style={{ color: '#F1F1F1' }}>$0.00</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Your Rewards</div>
          <div className="text-2xl font-bold" style={{ color: '#10B981' }}>0 SHAH</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Active Pools</div>
          <div className="text-2xl font-bold" style={{ color: '#F1F1F1' }}>3</div>
        </div>
      </div>

      {/* Farming Pools */}
      <div>
        <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Active Farming Pools</h2>
        
        <div className="grid grid-cols-2 gap-6">
          {pools.map((pool, index) => (
            <div key={index} className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {pool.tokens.map((token, i) => (
                      <div key={i} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: i === 0 ? '#D4AF37' : i === 1 ? '#3B82F6' : '#10B981', border: '2px solid #0A0A0A' }}>
                        <span className="text-xs text-white">{token}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>{pool.name}</div>
                    <div className="text-xs" style={{ color: '#A1A1AA' }}>Liquidity Pool</div>
                  </div>
                </div>
                {pool.isFeatured && (
                  <div className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    Featured
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>APY</div>
                  <div className="text-lg flex items-center gap-1" style={{ color: '#10B981' }}>
                    <TrendingUp className="w-4 h-4" />
                    {pool.apy}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>TVL</div>
                  <div className="text-sm" style={{ color: '#F1F1F1' }}>{pool.tvl}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Rewards</div>
                  <div className="text-sm" style={{ color: pool.rewards === '0' ? '#A1A1AA' : '#F1F1F1' }}>{pool.rewards === '0' ? 'None' : pool.rewards}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {pool.rewards !== '0' ? (
                  <>
                    <button className="flex-1 py-2 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                      Claim Rewards
                    </button>
                    <button className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80" style={{ borderWidth: '1px', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37', background: 'transparent' }}>
                      Deposit
                    </button>
                  </>
                ) : (
                  <button className="w-full py-2 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    Add Liquidity
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-6 rounded-2xl" style={{ background: 'rgba(59, 130, 246, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h3 className="text-lg mb-2" style={{ color: '#3B82F6' }}>💡 How Farming Works</h3>
        <p className="text-sm" style={{ color: '#A1A1AA' }}>
          Provide liquidity to SHAH trading pairs and earn rewards in SHAH tokens. Higher APY pools typically have higher risk. Always do your own research before providing liquidity.
        </p>
      </div>
    </div>
  )
}
