import { Droplets, TrendingUp, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import shahBlueLogo from 'figma:asset/88d7df6b7125a93f578ca49664988348e076f5d8.png';

const liquidityPools = [
  {
    pair: 'SHAH/ETH',
    token1: 'SHAH',
    token2: 'ETH',
    tvl: '$2,450,000',
    apr: '124%',
    volume24h: '$845,200',
    yourLiquidity: '$5,420',
    shareOfPool: '0.22%',
    isActive: true,
  },
  {
    pair: 'SHAH/USDT',
    token1: 'SHAH',
    token2: 'USDT',
    tvl: '$1,820,000',
    apr: '86%',
    volume24h: '$423,100',
    yourLiquidity: '$0',
    shareOfPool: '0%',
    isActive: false,
  },
  {
    pair: 'SHAH/BTC',
    token1: 'SHAH',
    token2: 'BTC',
    tvl: '$980,000',
    apr: '142%',
    volume24h: '$156,800',
    yourLiquidity: '$0',
    shareOfPool: '0%',
    isActive: false,
  },
  {
    pair: 'ETH/USDT',
    token1: 'ETH',
    token2: 'USDT',
    tvl: '$5,240,000',
    apr: '42%',
    volume24h: '$1,245,600',
    yourLiquidity: '$0',
    shareOfPool: '0%',
    isActive: false,
  },
];

export function PoolsPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-2" style={{ color: '#F1F1F1' }}>Liquidity Pools</h1>
          <p className="text-sm sm:text-base" style={{ color: '#A1A1AA' }}>Provide liquidity and earn trading fees</p>
        </div>
        
        <Button className="px-4 sm:px-6 w-full sm:w-auto touch-manipulation" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
          Create Pool
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Droplets className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Your Liquidity</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>$5,420</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>Across 1 pool</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Fees Earned (24h)</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#10B981' }}>$42.50</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>+$2.30 today</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
              <Droplets className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Total TVL</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#F1F1F1' }}>$10.49M</div>
          <div className="text-xs" style={{ color: '#10B981' }}>+5.2% (24h)</div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#D4AF37' }} />
            </div>
            <div className="text-sm" style={{ color: '#A1A1AA' }}>Avg APR</div>
          </div>
          <div className="text-2xl mb-1" style={{ color: '#D4AF37' }}>98.5%</div>
          <div className="text-xs" style={{ color: '#A1A1AA' }}>Across all pools</div>
        </div>
      </div>

      {/* Active Pools Section */}
      {liquidityPools.some(p => p.isActive) && (
        <div className="mb-8">
          <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>Your Active Pools</h2>
          
          <div className="space-y-4">
            {liquidityPools
              .filter(pool => pool.isActive)
              .map((pool, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl"
                  style={{
                    background: 'rgba(17, 17, 17, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.15)',
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ background: '#D4AF37', border: '2px solid #0A0A0A' }}>
                          <span className="text-xs sm:text-sm text-black">{pool.token1.substring(0, 1)}</span>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ background: '#3B82F6', border: '2px solid #0A0A0A' }}>
                          <span className="text-xs sm:text-sm text-white">{pool.token2.substring(0, 1)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base sm:text-lg mb-1" style={{ color: '#F1F1F1' }}>{pool.pair}</h3>
                        <div className="flex gap-2">
                          <Badge className="text-xs" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                            Active
                          </Badge>
                          <Badge className="text-xs" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            {pool.apr} APR
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 lg:flex-initial text-sm touch-manipulation" style={{ borderColor: 'rgba(212, 175, 55, 0.3)', color: '#D4AF37' }}>
                        Remove
                      </Button>
                      <Button className="flex-1 lg:flex-initial text-sm touch-manipulation" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                        Add Liquidity
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Your Liquidity</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.yourLiquidity}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Pool Share</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.shareOfPool}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Total TVL</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.tvl}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>24h Volume</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.volume24h}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>Fees Earned</div>
                      <div style={{ color: '#10B981' }}>$42.50</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Pools */}
      <div>
        <h2 className="text-xl mb-4" style={{ color: '#F1F1F1' }}>All Pools</h2>
        
        <div className="space-y-3">
          {liquidityPools.map((pool, index) => (
            <div
              key={index}
              className="p-5 rounded-xl hover:scale-[1.01] transition-all"
              style={{
                background: 'rgba(17, 17, 17, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center p-1.5" style={{ background: pool.token1 === 'SHAH' ? 'rgba(59, 130, 246, 0.2)' : '#3B82F6', border: '2px solid #0A0A0A' }}>
                      {pool.token1 === 'SHAH' ? (
                        <img src={shahBlueLogo} alt="SHAH" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-white">{pool.token1.substring(0, 1)}</span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: pool.token2 === 'ETH' ? '#3B82F6' : pool.token2 === 'USDT' ? '#10B981' : '#F97316', border: '2px solid #0A0A0A' }}>
                      <span className="text-xs text-white">{pool.token2.substring(0, 1)}</span>
                    </div>
                  </div>

                  <div className="min-w-[120px]">
                    <div style={{ color: '#F1F1F1' }}>{pool.pair}</div>
                    {pool.isActive && (
                      <div className="text-xs" style={{ color: '#D4AF37' }}>Your position</div>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-8">
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>TVL</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.tvl}</div>
                    </div>

                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>APR</div>
                      <div style={{ color: '#10B981' }}>{pool.apr}</div>
                    </div>

                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A1A1AA' }}>24h Volume</div>
                      <div style={{ color: '#F1F1F1' }}>{pool.volume24h}</div>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  style={{
                    background: pool.isActive ? '#111111' : 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)',
                    color: pool.isActive ? '#F1F1F1' : '#0A0A0A',
                    border: pool.isActive ? '1px solid rgba(212, 175, 55, 0.2)' : 'none',
                  }}
                >
                  {pool.isActive ? 'Manage' : 'Add Liquidity'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-8 p-6 rounded-2xl" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h3 className="text-lg mb-2" style={{ color: '#3B82F6' }}>💡 How Liquidity Pools Work</h3>
        <p className="text-sm" style={{ color: '#A1A1AA' }}>
          When you provide liquidity to a pool, you'll receive LP tokens representing your share. You earn a portion of all trading fees based on your pool share. The APR shown includes both trading fees and any additional farming rewards available.
        </p>
      </div>
    </div>
  );
}