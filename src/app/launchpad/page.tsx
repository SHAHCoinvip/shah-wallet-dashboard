'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Rocket, Clock, CheckCircle } from 'lucide-react'
import { getDropsByStatus, getLaunchpadStats, LaunchpadDrop, LaunchpadStats } from '@/lib/launchpad'
import DropCard from '@/components/DropCard'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

type TabType = 'upcoming' | 'live' | 'archived'

export default function LaunchpadPage() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('live')
  const [drops, setDrops] = useState<LaunchpadDrop[]>([])
  const [stats, setStats] = useState<LaunchpadStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Load drops and stats
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [dropsData, statsData] = await Promise.all([
        getDropsByStatus(activeTab === 'archived' ? 'ended' : activeTab),
        getLaunchpadStats()
      ])
      
      setDrops(dropsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading launchpad data:', error)
    } finally {
      setLoading(false)
    }
  }

  const featuredDrop = drops.find(d => d.status === 'live') || drops[0]

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>NFT Launchpad</h1>
        <p style={{ color: '#A1A1AA' }}>Discover and mint exclusive NFT collections</p>
      </div>

      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Rocket className="w-10 h-10" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>Connect your wallet to mint NFTs</p>
            <ConnectButton />
          </div>
        </div>
      ) : (
        <>
          {/* Featured Hero */}
          {featuredDrop && (
            <div className="mb-8 p-8 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)', boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)' }}>
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)' }} />
              
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="flex flex-col justify-center">
                  <div className="px-3 py-1 rounded-full text-xs mb-4 w-fit" style={{ background: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
                    Featured Collection
                  </div>
                  
                  <h2 className="text-4xl mb-4" style={{ color: '#D4AF37' }}>{featuredDrop.name}</h2>
                  
                  <p className="mb-6" style={{ color: '#A1A1AA' }}>
                    {featuredDrop.description || 'Exclusive NFT collection with special benefits and rewards.'}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Total Supply</div>
                      <div className="text-xl" style={{ color: '#F1F1F1' }}>{featuredDrop.totalSupply || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Minted</div>
                      <div className="text-xl" style={{ color: '#F1F1F1' }}>{featuredDrop.mintedCount || '0'}</div>
                    </div>
                    <div>
                      <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Price</div>
                      <div className="text-xl" style={{ color: '#D4AF37' }}>{featuredDrop.priceUSD ? `$${featuredDrop.priceUSD}` : 'TBA'}</div>
                    </div>
                  </div>
                  
                  <button className="w-fit px-8 h-12 rounded-lg font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                    Mint Now
                  </button>
                </div>
                
                <div className="flex items-center justify-center">
                  {featuredDrop.imageUrl ? (
                    <div className="w-80 h-80 rounded-2xl overflow-hidden" style={{ border: '2px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}>
                      <img 
                        src={featuredDrop.imageUrl}
                        alt={featuredDrop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-80 h-80 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '2px solid rgba(212, 175, 55, 0.3)' }}>
                      <Rocket className="w-24 h-24" style={{ color: '#D4AF37' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 rounded-lg w-fit" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <button
                onClick={() => setActiveTab('live')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: activeTab === 'live' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  color: activeTab === 'live' ? '#D4AF37' : '#A1A1AA'
                }}
              >
                <CheckCircle className="w-4 h-4" />
                Live
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: activeTab === 'upcoming' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  color: activeTab === 'upcoming' ? '#D4AF37' : '#A1A1AA'
                }}
              >
                <Clock className="w-4 h-4" />
                Upcoming
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: activeTab === 'archived' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  color: activeTab === 'archived' ? '#D4AF37' : '#A1A1AA'
                }}
              >
                <Rocket className="w-4 h-4" />
                Archived
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(17, 17, 17, 0.6)' }}>
                  <div className="h-64" style={{ background: 'rgba(10, 10, 10, 0.5)' }}></div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 rounded" style={{ background: 'rgba(10, 10, 10, 0.5)', width: '75%' }}></div>
                    <div className="h-4 rounded" style={{ background: 'rgba(10, 10, 10, 0.5)', width: '50%' }}></div>
                    <div className="h-4 rounded" style={{ background: 'rgba(10, 10, 10, 0.5)' }}></div>
                    <div className="h-10 rounded" style={{ background: 'rgba(10, 10, 10, 0.5)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : drops.length === 0 ? (
            <div className="text-center py-16">
              <Rocket className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: '#A1A1AA' }} />
              <h3 className="text-xl mb-2" style={{ color: '#F1F1F1' }}>
                {activeTab === 'live' ? 'No Live Drops' : activeTab === 'upcoming' ? 'No Upcoming Drops' : 'No Archived Collections'}
              </h3>
              <p style={{ color: '#A1A1AA' }}>
                {activeTab === 'live' ? 'All current drops have ended' : activeTab === 'upcoming' ? 'New drops are being prepared' : 'Past drops will appear here'}
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-3 gap-6"
            >
              {drops.map((drop) => (
                <DropCard key={drop.id} drop={drop} />
              ))}
            </motion.div>
          )}

          {/* Partner Logos */}
          <div className="mt-12 p-8 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <h3 className="text-center mb-6" style={{ color: '#A1A1AA' }}>Trusted Partners</h3>
            <div className="flex items-center justify-center gap-12">
              {['OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'Nifty'].map((partner, index) => (
                <div key={index} className="text-xl opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#F1F1F1' }}>
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
