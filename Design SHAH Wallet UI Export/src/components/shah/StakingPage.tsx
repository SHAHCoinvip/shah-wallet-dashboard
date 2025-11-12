import { Trophy, TrendingUp, Coins, Gift } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';

const stakingTiers = [
  {
    name: 'Bronze',
    icon: '🥉',
    minStake: '100 SHAH',
    apy: '12%',
    staked: 150,
    color: '#CD7F32',
    glowColor: 'rgba(205, 127, 50, 0.2)',
  },
  {
    name: 'Silver',
    icon: '🥈',
    minStake: '500 SHAH',
    apy: '24%',
    staked: 750,
    color: '#C0C0C0',
    glowColor: 'rgba(192, 192, 192, 0.2)',
  },
  {
    name: 'Gold',
    icon: '👑',
    minStake: '1,000 SHAH',
    apy: '48%',
    staked: 2500,
    color: '#D4AF37',
    glowColor: 'rgba(212, 175, 55, 0.3)',
    isActive: true,
  },
];

export function StakingPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl mb-2" style={{ color: '#F1F1F1' }}>Staking & Farming</h1>
        <p className="text-sm sm:text-base" style={{ color: '#A1A1AA' }}>Earn rewards by staking your SHAH tokens</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Coins className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Total Staked</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>3,400 SHAH</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>≈ $12,240</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Current APY</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#10B981' }}>48%</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>Gold Tier</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Gift className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Rewards Earned</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>284.5 SHAH</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>≈ $1,024.20</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Trophy className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>NFT Boost</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#D4AF37' }}>+25%</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>SHAH GOLD NFT</div>
        </div>
      </div>

      {/* Staking Tiers */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl mb-4" style={{ color: '#F1F1F1' }}>Staking Tiers</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {stakingTiers.map((tier, index) => (
            <div
              key={index}
              className="p-5 sm:p-6 rounded-2xl relative overflow-hidden transition-all hover:scale-105"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: tier.isActive ? `2px solid ${tier.color}` : '1px solid rgba(212, 175, 55, 0.1)',
                boxShadow: tier.isActive ? `0 0 30px ${tier.glowColor}` : 'none',
              }}
            >
              {tier.isActive && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <Badge className="text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    Active
                  </Badge>
                </div>
              )}
              
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{tier.icon}</div>
              
              <h3 className="text-lg sm:text-xl mb-2" style={{ color: tier.color }}>{tier.name}</h3>
              
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: '#A1A1AA' }}>Min. Stake</span>
                  <span className="text-xs sm:text-sm" style={{ color: '#F1F1F1' }}>{tier.minStake}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm" style={{ color: '#A1A1AA' }}>APY</span>
                  <span className="text-base sm:text-lg" style={{ color: '#10B981' }}>{tier.apy}</span>
                </div>
                
                {tier.isActive && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm" style={{ color: '#A1A1AA' }}>Your Stake</span>
                      <span className="text-xs sm:text-sm" style={{ color: '#F1F1F1' }}>{tier.staked} SHAH</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                )}
              </div>
              
              {tier.isActive ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full text-sm touch-manipulation" style={{ borderColor: tier.color, color: tier.color }}>
                    Unstake
                  </Button>
                  <Button className="w-full text-sm touch-manipulation" style={{ background: `linear-gradient(135deg, ${tier.color} 0%, ${tier.color}dd 100%)`, color: '#0A0A0A' }}>
                    Add More
                  </Button>
                </div>
              ) : (
                <Button className="w-full text-sm touch-manipulation" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  Stake Now
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Pools */}
      <div>
        <h2 className="text-lg sm:text-xl mb-4" style={{ color: '#F1F1F1' }}>Active Farming Pools</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
              <Badge style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                Featured
              </Badge>
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
              <Button className="flex-1" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                Claim Rewards
              </Button>
              <Button variant="outline" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                Deposit
              </Button>
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
            
            <Button className="w-full" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              Add Liquidity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}