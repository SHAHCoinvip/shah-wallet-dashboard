'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Rocket, Clock, CheckCircle } from 'lucide-react'
import { getDropsByStatus, getLaunchpadStats, LaunchpadDrop, LaunchpadStats } from '@/lib/launchpad'
import DropCard from '@/components/DropCard'

export const dynamic = 'force-dynamic'

type TabType = 'upcoming' | 'live' | 'archived'

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'live', label: 'Live', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'upcoming', label: 'Upcoming', icon: <Clock className="w-4 h-4" /> },
  { id: 'archived', label: 'Archived', icon: <Rocket className="w-4 h-4" /> },
]

export default function LaunchpadPage() {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<TabType>('live')
  const [drops, setDrops] = useState<LaunchpadDrop[]>([])
  const [stats, setStats] = useState<LaunchpadStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const [dropsData, statsData] = await Promise.all([
        getDropsByStatus(activeTab === 'archived' ? 'ended' : activeTab),
        getLaunchpadStats(),
      ])
      setDrops(dropsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading launchpad data:', error)
    } finally {
      setLoading(false)
    }
  }

  const featuredDrop = drops.find((drop) => drop.status === 'live') || drops[0]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">NFT Launchpad</h1>
          <p className="page-subtitle">Discover artist-led drops and curated collections</p>
        </div>
        <div className="hidden md:block">
          <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
        </div>
      </div>

      {!isConnected ? (
        <section className="card card-glass text-center py-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.18)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Rocket className="w-8 h-8" color="var(--gold)" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
            Connect your wallet to mint featured SHAH launchpad collections
          </p>
          <ConnectButton />
        </section>
      ) : (
        <div className="space-y-8">
          {featuredDrop && (
            <section className="card card-glass overflow-hidden">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col justify-center gap-6">
                  <div className="badge" style={{ background: 'rgba(212, 175, 55, 0.18)', color: 'var(--gold)', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                    Featured Collection
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold" style={{ color: 'var(--gold)' }}>
                      {featuredDrop.name}
                    </h2>
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {featuredDrop.description || 'Exclusive NFT collection with premium utilities for early adopters.'}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] p-4">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Supply</p>
                      <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {featuredDrop.totalSupply || 'TBA'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111111] p-4">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Minted</p>
                      <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {featuredDrop.mintedCount || 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.14)] p-4">
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Mint Price</p>
                      <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--gold)' }}>
                        {featuredDrop.priceUSD ? `$${featuredDrop.priceUSD}` : 'TBA'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="btn-gold">Mint Now</button>
                    <button className="btn-outline">View Drop Details</button>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {featuredDrop.imageUrl ? (
                    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.25)]">
                      <img src={featuredDrop.imageUrl} alt={featuredDrop.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.25)]" style={{ background: 'rgba(212, 175, 55, 0.12)' }}>
                      <Rocket className="h-16 w-16" color="var(--gold)" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
                    style={{
                      background: activeTab === tab.id ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--gold)' : 'var(--text-secondary)',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {stats && (
                <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    Total Raised: ${stats.totalRaisedUSD?.toLocaleString() ?? '0'}
                  </span>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    Participants: {stats.totalParticipants?.toLocaleString() ?? '0'}
                  </span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="card card-glass animate-pulse space-y-4">
                    <div className="h-48 rounded-xl bg-[rgba(255,255,255,0.04)]" />
                    <div className="space-y-3">
                      <div className="h-4 rounded bg-[rgba(255,255,255,0.06)]" />
                      <div className="h-4 w-1/2 rounded bg-[rgba(255,255,255,0.06)]" />
                      <div className="h-10 rounded bg-[rgba(255,255,255,0.06)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : drops.length === 0 ? (
              <section className="card card-glass text-center py-16">
                <Rocket className="mx-auto mb-4 h-14 w-14" color="var(--text-secondary)" />
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {activeTab === 'live' ? 'No Live Drops' : activeTab === 'upcoming' ? 'No Upcoming Drops' : 'No Archived Collections'}
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {activeTab === 'live'
                    ? 'All drops have concluded. Check back for the next launch.'
                    : activeTab === 'upcoming'
                    ? 'Our curators are preparing the next generation of drops.'
                    : 'Completed launches will appear here for archival reference.'}
                </p>
              </section>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {drops.map((drop) => (
                  <DropCard key={drop.id} drop={drop} />
                ))}
              </motion.div>
            )}
          </section>

          <section className="card card-glass">
            <h3 className="text-center text-sm uppercase tracking-[3px]" style={{ color: 'var(--text-secondary)' }}>
              Trusted Partners
            </h3>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {['OpenSea', 'Rarible', 'SuperRare', 'Foundation', 'Nifty Gateway'].map((partner) => (
                <span key={partner} className="opacity-60 transition hover:opacity-100">
                  {partner}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  )
}
