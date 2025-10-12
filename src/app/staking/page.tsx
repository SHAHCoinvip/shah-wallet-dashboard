'use client'

import { Trophy, TrendingUp, Coins, Gift } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { useStakingInfo } from '@/hooks/useStakingInfo'
import { useShahStakingActions } from '@/hooks/useShahStakingActions'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { parseEther } from 'viem'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const stakingTiers = [
  {
    name: 'Bronze',
    icon: '🥉',
    minStake: '100',
    apy: '12%',
    tier: 1,
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.2)',
  },
  {
    name: 'Silver',
    icon: '🥈',
    minStake: '500',
    apy: '24%',
    tier: 2,
    color: '#C0C0C0',
    glowColor: 'rgba(192, 192, 192, 0.2)',
  },
  {
    name: 'Gold',
    icon: '👑',
    minStake: '1,000',
    apy: '48%',
    tier: 3,
    color: '#D4AF37',
    glowColor: 'rgba(212, 175, 55, 0.3)',
  },
]

export default function StakingPage() {
  const { address, isConnected } = useAccount()
  const { amountStaked, tier, hasNftBoost, rewards } = useStakingInfo(address)
  const { stake, unstake, claimRewards } = useShahStakingActions()
  
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake')

  const handleStake = async () => {
    if (!stakeAmount) {
      toast.error('Please enter an amount')
      return
    }

    try {
      const amount = parseEther(stakeAmount)
      await stake(amount)
      toast.success('Stake transaction sent!')
      setStakeAmount('')
    } catch (error) {
      console.error('Error staking:', error)
      toast.error('Failed to stake')
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount) {
      toast.error('Please enter an amount')
      return
    }

    try {
      const amount = parseEther(unstakeAmount)
      await unstake(amount)
      toast.success('Unstake transaction sent!')
      setUnstakeAmount('')
    } catch (error) {
      console.error('Error unstaking:', error)
      toast.error('Failed to unstake')
    }
  }

  const handleClaimRewards = async () => {
    try {
      await claimRewards()
      toast.success('Claim transaction sent!')
    } catch (error) {
      console.error('Error claiming rewards:', error)
      toast.error('Failed to claim rewards')
    }
  }

  const userTier = stakingTiers.find(t => t.tier === tier)
  const stakedAmount = amountStaked ? parseFloat(amountStaked.toString()) / 1e18 : 0
  const rewardsAmount = rewards ? parseFloat(rewards.toString()) / 1e18 : 0

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Staking & Farming</h1>
        <p style={{ color: '#A1A1AA' }}>Earn rewards by staking your SHAH tokens</p>
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Coins className="w-10 h-10" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>Connect your wallet to start staking SHAH tokens</p>
            <ConnectButton />
          </div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                  <Coins className="w-5 h-5" style={{ color: '#D4AF37' }} />
                </div>
                <div className="text-sm" style={{ color: '#A1A1AA' }}>Total Staked</div>
              </div>
              <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>{stakedAmount.toFixed(2)} SHAH</div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>≈ ${(stakedAmount * 1.72).toFixed(2)}</div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-sm" style={{ color: '#A1A1AA' }}>Current APY</div>
              </div>
              <div className="text-2xl mb-1" style={{ color: '#10B981' }}>
                {userTier ? userTier.apy : '0%'}
              </div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>
                {userTier ? userTier.name + ' Tier' : 'No Tier'}
              </div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                  <Gift className="w-5 h-5" style={{ color: '#3B82F6' }} />
                </div>
                <div className="text-sm" style={{ color: '#A1A1AA' }}>Rewards Earned</div>
              </div>
              <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>{rewardsAmount.toFixed(2)} SHAH</div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>≈ ${(rewardsAmount * 1.72).toFixed(2)}</div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
                  <Trophy className="w-5 h-5" style={{ color: '#D4AF37' }} />
                </div>
                <div className="text-sm" style={{ color: '#A1A1AA' }}>NFT Boost</div>
              </div>
              <div className="text-2xl mb-1" style={{ color: hasNftBoost ? '#D4AF37' : '#EF4444' }}>
                {hasNftBoost ? '+25%' : 'Inactive'}
              </div>
              <div className="text-xs" style={{ color: '#A1A1AA' }}>
                {hasNftBoost ? 'SHAH GOLD NFT' : 'No NFT'}
              </div>
            </div>
          </div>

          {/* Staking Tiers */}
          <div className="mb-8">
            <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Staking Tiers</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {stakingTiers.map((tierItem, index) => {
                const isActive = tierItem.tier === tier
                
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl relative overflow-hidden transition-all hover:scale-105"
                    style={{
                      background: 'rgba(17, 17, 17, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: isActive ? `2px solid ${tierItem.color}` : '1px solid rgba(212, 175, 55, 0.1)',
                      boxShadow: isActive ? `0 0 30px ${tierItem.glowColor}` : 'none',
                    }}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                          Active
                        </div>
                      </div>
                    )}
                    
                    <div className="text-4xl mb-4">{tierItem.icon}</div>
                    
                    <h3 className="text-xl mb-2" style={{ color: tierItem.color }}>{tierItem.name}</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: '#A1A1AA' }}>Min. Stake</span>
                        <span className="text-sm" style={{ color: '#F1F1F1' }}>{tierItem.minStake} SHAH</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: '#A1A1AA' }}>APY</span>
                        <span className="text-lg" style={{ color: '#10B981' }}>{tierItem.apy}</span>
                      </div>
                      
                      {isActive && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm" style={{ color: '#A1A1AA' }}>Your Stake</span>
                            <span className="text-sm" style={{ color: '#F1F1F1' }}>{stakedAmount.toFixed(2)} SHAH</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${Math.min((stakedAmount / parseFloat(tierItem.minStake.replace(',', ''))) * 100, 100)}%`,
                                background: 'linear-gradient(90deg, #D4AF37 0%, #F4D03F 100%)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {isActive ? (
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setActiveTab('unstake')}
                          className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                          style={{ borderWidth: '1px', borderColor: tierItem.color, color: tierItem.color, background: 'transparent' }}
                        >
                          Unstake
                        </button>
                        <button 
                          onClick={() => setActiveTab('stake')}
                          className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                          style={{ background: `linear-gradient(135deg, ${tierItem.color} 0%, ${tierItem.color}dd 100%)`, color: '#0A0A0A' }}
                        >
                          Add More
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('stake')}
                        className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                        style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}
                      >
                        Stake Now
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stake/Unstake Form */}
          <div className="mb-8">
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              {/* Tabs */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setActiveTab('stake')}
                  className="px-6 py-2 rounded-lg font-medium transition-all"
                  style={{
                    background: activeTab === 'stake' ? 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)' : 'transparent',
                    color: activeTab === 'stake' ? '#0A0A0A' : '#A1A1AA',
                    border: activeTab === 'stake' ? 'none' : '1px solid rgba(212, 175, 55, 0.2)'
                  }}
                >
                  Stake
                </button>
                <button
                  onClick={() => setActiveTab('unstake')}
                  className="px-6 py-2 rounded-lg font-medium transition-all"
                  style={{
                    background: activeTab === 'unstake' ? 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)' : 'transparent',
                    color: activeTab === 'unstake' ? '#0A0A0A' : '#A1A1AA',
                    border: activeTab === 'unstake' ? 'none' : '1px solid rgba(212, 175, 55, 0.2)'
                  }}
                >
                  Unstake
                </button>
                {rewardsAmount > 0 && (
                  <button
                    onClick={handleClaimRewards}
                    className="ml-auto px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', color: '#FFFFFF' }}
                  >
                    Claim Rewards
                  </button>
                )}
              </div>

              {/* Form */}
              {activeTab === 'stake' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: '#A1A1AA' }}>Amount to Stake</label>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full p-4 rounded-xl text-lg focus:outline-none"
                      style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)', color: '#F1F1F1' }}
                    />
                  </div>
                  <button
                    onClick={handleStake}
                    disabled={!stakeAmount}
                    className="w-full h-12 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}
                  >
                    Stake SHAH
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: '#A1A1AA' }}>Amount to Unstake</label>
                    <input
                      type="text"
                      placeholder="0.0"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      className="w-full p-4 rounded-xl text-lg focus:outline-none"
                      style={{ background: 'rgba(10, 10, 10, 0.5)', border: '1px solid rgba(212, 175, 55, 0.1)', color: '#F1F1F1' }}
                    />
                    <div className="text-xs mt-2" style={{ color: '#A1A1AA' }}>
                      Available: {stakedAmount.toFixed(2)} SHAH
                    </div>
                  </div>
                  <button
                    onClick={handleUnstake}
                    disabled={!unstakeAmount}
                    className="w-full h-12 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}
                  >
                    Unstake SHAH
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Pools */}
          <div>
            <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Active Farming Pools</h2>
            
            <div className="grid grid-cols-2 gap-6">
              {/* SHAH-ETH Pool */}
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#D4AF37', border: '2px solid #0A0A0A' }}>
                        <span className="text-xs">SHAH</span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#3B82F6', border: '2px solid #0A0A0A' }}>
                        <span className="text-xs text-white">ETH</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: '#F1F1F1' }}>SHAH-ETH</div>
                      <div className="text-xs" style={{ color: '#A1A1AA' }}>Liquidity Pool</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    Featured
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>APY</div>
                    <div className="text-lg" style={{ color: '#10B981' }}>124%</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>TVL</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>$2.4M</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Rewards</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>45.2 SHAH</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                    Claim Rewards
                  </button>
                  <button className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80" style={{ borderWidth: '1px', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37', background: 'transparent' }}>
                    Deposit
                  </button>
                </div>
              </div>

              {/* SHAH-USDT Pool */}
              <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#D4AF37', border: '2px solid #0A0A0A' }}>
                        <span className="text-xs">SHAH</span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#10B981', border: '2px solid #0A0A0A' }}>
                        <span className="text-xs text-white">USDT</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: '#F1F1F1' }}>SHAH-USDT</div>
                      <div className="text-xs" style={{ color: '#A1A1AA' }}>Liquidity Pool</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>APY</div>
                    <div className="text-lg" style={{ color: '#10B981' }}>86%</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>TVL</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>$1.8M</div>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Your LP</div>
                    <div className="text-sm" style={{ color: '#F1F1F1' }}>0.0</div>
                  </div>
                </div>
                
                <button className="w-full py-2 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  Add Liquidity
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

