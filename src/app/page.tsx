'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Copy, ExternalLink } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getAiTip } from '@/utils/aiTip'
import TokenBarChart from '@/components/TokenBarChart'
import VerifiedBadge from '@/components/VerifiedBadge'
import ChartEmbed from '@/components/ChartEmbed'
import TxHistory from '@/components/TxHistory'
import { useStakingInfo } from '@/hooks/useStakingInfo'
import TokenRow from '@/components/TokenRow'
import SupabaseTest from '@/components/SupabaseTest'
import { loadStripe } from '@stripe/stripe-js'
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Chart data placeholder
const chartData = [
  { time: '00:00', price: 1.4 },
  { time: '04:00', price: 1.6 },
  { time: '08:00', price: 1.5 },
  { time: '12:00', price: 1.72 },
  { time: '16:00', price: 1.7 },
  { time: '20:00', price: 1.75 },
  { time: '24:00', price: 1.72 },
]

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const { amountStaked, tier, hasNftBoost } = useStakingInfo(address)

  const [ethBalance, setEthBalance] = useState<string>('0.0000')
  const [tokenBalances, setTokenBalances] = useState<any[]>([])
  const [totalUSD, setTotalUSD] = useState<number>(0)
  const [aiTip, setAiTip] = useState<string>('')
  const [tipHistory, setTipHistory] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [tradeLog, setTradeLog] = useState<string[]>([])
  const [botActive, setBotActive] = useState(false)
  const [botStatus, setBotStatus] = useState('Bot is off')
  const [discoveryTokens, setDiscoveryTokens] = useState<any[]>([])

  const fetchBalances = async (walletAddress: string) => {
    try {
      const eth = 0 // Placeholder
      const tokens = [] // Placeholder

      setEthBalance(eth.toString())
      setTokenBalances(tokens)

      const total = tokens.reduce((acc, t) => acc + (t.usdValue || 0), 0)
      setTotalUSD(total)

      const tipPrompt = `My wallet tokens are: ${tokens.map((t) => `${t.symbol} (${t.balance})`).join(', ')}. Suggest a useful crypto wallet tip.`
      const tip = await getAiTip(tipPrompt)
      setAiTip(tip)
      setTipHistory((prev) => [tip, ...prev])

      const tradePrompt = `These are my wallet tokens: ${tokens.map((t) => `${t.symbol} (${t.balance})`).join(', ')}. What are some smart crypto trading ideas I can take right now?`
      const aiTrades = await getAiTip(tradePrompt)
      setTradeLog([aiTrades])
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/send-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tip: aiTip }),
      })
    } catch (err) {
      console.error('Failed to send email tip:', err)
    }
  }

  const handlePurchase = async () => {
    const stripe = await stripePromise
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    await stripe?.redirectToCheckout({ sessionId: data.id })
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances(address)
    }
  }, [address, isConnected])

  // Load discovery data
  useEffect(() => {
    const loadDiscoveryData = async () => {
      if (!process.env.NEXT_PUBLIC_ENABLE_DISCOVERY || process.env.NEXT_PUBLIC_ENABLE_DISCOVERY !== 'true') {
        return
      }

      try {
        const discoveryData: any[] = [] // Placeholder
        setDiscoveryTokens(discoveryData)
      } catch (error) {
        console.error('Error loading discovery data:', error)
      }
    }

    loadDiscoveryData()
  }, [])

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#0A0A0A' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#F1F1F1' }}>Dashboard</h1>
          <p style={{ color: '#A1A1AA' }}>Welcome back to your SHAH Wallet</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            Ethereum Mainnet
          </div>
          
          {isConnected && address && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <Wallet className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <span className="text-sm" style={{ color: '#F1F1F1' }}>{formatAddress(address)}</span>
              <button className="hover:opacity-70 transition-opacity" onClick={() => navigator.clipboard.writeText(address)}>
                <Copy className="w-4 h-4" style={{ color: '#A1A1AA' }} />
              </button>
            </div>
          )}
          
          {!isConnected && (
            <ConnectButton />
          )}
        </div>
      </div>

      {isConnected ? (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* ETH Balance */}
            <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>ETH Balance</div>
                <div className="text-3xl mb-1" style={{ color: '#F1F1F1' }}>{ethBalance}</div>
                <div className="text-sm flex items-center gap-1" style={{ color: '#3B82F6' }}>
                  <TrendingUp className="w-4 h-4" />
                  <span>${(parseFloat(ethBalance) * 2000).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* SHAH Token */}
            <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }} />
              <div className="absolute top-4 right-4 w-12 h-12 opacity-20">
                <Image src="/shah-blue-logo.png" alt="SHAH" width={48} height={48} className="object-contain" />
              </div>
              <div className="relative">
                <div className="text-sm mb-2 flex items-center gap-2" style={{ color: '#A1A1AA' }}>
                  <Image src="/shah-blue-logo.png" alt="SHAH" width={20} height={20} className="object-contain" />
                  SHAH Token
                </div>
                <div className="text-3xl mb-1" style={{ color: '#3B82F6' }}>{amountStaked?.toString() || '0'}</div>
                <div className="text-sm flex items-center gap-1" style={{ color: '#10B981' }}>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+12.5%</span>
                </div>
              </div>
            </div>

            {/* Total Portfolio */}
            <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }} />
              <div className="relative">
                <div className="text-sm mb-2" style={{ color: '#A1A1AA' }}>Total Portfolio</div>
                <div className="text-3xl mb-1" style={{ color: '#F1F1F1' }}>${totalUSD.toFixed(2)}</div>
                <div className="text-sm flex items-center gap-1" style={{ color: '#10B981' }}>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+8.2% (24h)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Link href="/swap">
              <button className="h-14 w-full rounded-lg font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%)', color: '#0A0A0A' }}>
                Swap
              </button>
            </Link>
            <Link href="/staking">
              <button className="h-14 w-full rounded-lg font-medium transition-all hover:opacity-90" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                Stake
              </button>
            </Link>
            <Link href="/farming">
              <button className="h-14 w-full rounded-lg font-medium transition-all hover:opacity-90" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                Farm
              </button>
            </Link>
            <button onClick={handlePurchase} className="h-14 w-full rounded-lg font-medium transition-all hover:opacity-90" style={{ background: '#111111', color: '#F1F1F1', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              Buy Crypto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Chart Widget */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg mb-1" style={{ color: '#F1F1F1' }}>SHAH Price</h3>
                  <div className="text-2xl" style={{ color: '#D4AF37' }}>$1.72</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    +18.2%
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.1)" />
                  <XAxis dataKey="time" stroke="#A1A1AA" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#A1A1AA" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#111111',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      borderRadius: '8px',
                      color: '#F1F1F1',
                    }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#D4AF37" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity - Using TxHistory */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <h3 className="text-lg mb-4" style={{ color: '#F1F1F1' }}>Recent Activity</h3>
              <TxHistory limit={4} />
            </div>
          </div>

          {/* Staking Info */}
          {amountStaked && parseFloat(amountStaked.toString()) > 0 && (
            <motion.div layout className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(212, 175, 55, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#D4AF37' }}>📈 Staking Tier & NFT Boost</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Your SHAH Balance</div>
                  <div className="text-2xl font-bold" style={{ color: '#F1F1F1' }}>{amountStaked?.toString() || '0'}</div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>Staking Tier</div>
                  <div className="text-2xl font-bold" style={{ color: '#D4AF37' }}>
                    {tier === 1 ? 'Bronze (10%)' : tier === 2 ? 'Silver (15%)' : tier === 3 ? 'Gold (20%)' : 'None'}
                  </div>
                </div>
                <div>
                  <div className="text-sm mb-1" style={{ color: '#A1A1AA' }}>NFT Boost</div>
                  <div className="text-2xl font-bold" style={{ color: hasNftBoost ? '#10B981' : '#EF4444' }}>
                    {hasNftBoost ? '✅ Active' : '❌ Inactive'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Token Balances */}
          {tokenBalances.length > 0 && (
            <motion.div layout className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Token Balances</h2>
              <div className="space-y-3">
                {tokenBalances.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(10, 10, 10, 0.5)' }}
                  >
                    <div className="flex items-center gap-3">
                      {token.logoURI && (
                        <img src={token.logoURI} alt={token.symbol} className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#F1F1F1' }}>{token.symbol}</span>
                          {token.address && <VerifiedBadge tokenAddress={token.address} className="ml-1" />}
                        </div>
                        <div className="text-sm" style={{ color: '#A1A1AA' }}>{token.balance}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: '#F1F1F1' }}>${(token.usdValue || 0).toFixed(2)}</div>
                      {token.address && !token.isVerified && (
                        <Link 
                          href="/factory/verify" 
                          className="text-xs hover:opacity-80"
                          style={{ color: '#3B82F6' }}
                        >
                          Request verification
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Discovery Card */}
          {process.env.NEXT_PUBLIC_ENABLE_DISCOVERY === 'true' && discoveryTokens.length > 0 && (
            <motion.div layout className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(138, 43, 226, 0.1)', backdropFilter: 'blur(20px)', border: '1px solid rgba(138, 43, 226, 0.2)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>🔍 Token Discovery</h2>
                <Link href="/discover" className="text-sm hover:opacity-80" style={{ color: '#A78BFA' }}>
                  See all →
                </Link>
              </div>
              
              <div className="space-y-3">
                {discoveryTokens.map((token, index) => (
                  <TokenRow
                    key={`${token.address}-${index}`}
                    address={token.address}
                    name={token.name}
                    symbol={token.symbol}
                    deployer={token.deployer}
                    createdAt={token.createdAt}
                    isVerified={token.type === 'verified'}
                    isNew={token.type === 'new'}
                    showActions={false}
                    className="bg-gray-800/50"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Features */}
          {aiTip && (
            <motion.div layout className="p-6 rounded-2xl mb-6" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: '#F1F1F1' }}>🤖 AI Wallet Tip</h2>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#A1A1AA' }}>{aiTip}</p>
            </motion.div>
          )}

          {/* Supabase Integration Test */}
          <motion.div layout className="mt-6">
            <SupabaseTest />
          </motion.div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center p-12 rounded-2xl" style={{ background: 'rgba(17, 17, 17, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <Wallet className="w-10 h-10" style={{ color: '#D4AF37' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
            <p className="mb-8" style={{ color: '#A1A1AA' }}>Connect your wallet to view your portfolio and start trading</p>
            <ConnectButton />
          </div>
        </div>
      )}
    </div>
  )
}
