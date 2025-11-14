'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { Wallet, TrendingUp, ArrowUpRight, Copy } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getAiTip } from '@/utils/aiTip'
import VerifiedBadge from '@/components/VerifiedBadge'
import TxHistory from '@/components/TxHistory'
import { useStakingInfo } from '@/hooks/useStakingInfo'
import TokenRow from '@/components/TokenRow'
import SupabaseTest from '@/components/SupabaseTest'
import { loadStripe } from '@stripe/stripe-js'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatUnits } from 'viem'
import { ERC20ABI } from '@/abi/ERC20'
import { getShahPriceUsd } from '@/lib/registry'

export const dynamic = 'force-dynamic'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  const [tokenBalances, setTokenBalances] = useState<
    { symbol: string; balance: string; usdValue: number; address?: string; isVerified?: boolean }[]
  >([])
  const [totalUSD, setTotalUSD] = useState<number>(0)
  const [aiTip, setAiTip] = useState<string>('')
  const [tipHistory, setTipHistory] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [discoveryTokens, setDiscoveryTokens] = useState<any[]>([])

  const [ethPrice, setEthPrice] = useState<number>(0)
  const [shahPrice, setShahPrice] = useState<number>(1.72)

  const shahTokenAddress = process.env.NEXT_PUBLIC_SHAH as `0x${string}` | undefined

  const { data: ethBalanceData } = useBalance({
    address,
    query: {
      enabled: isConnected && !!address,
      watch: true,
    },
  })

  const { data: shahBalanceData } = useReadContract({
    address: shahTokenAddress,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && shahTokenAddress),
      watch: true,
    },
  })

  const formattedEthBalance = useMemo(() => ethBalanceData?.formatted ?? '0', [ethBalanceData])
  const formattedShahBalance = useMemo(() => {
    if (!shahBalanceData) return '0'
    try {
      return formatUnits(shahBalanceData as bigint, 18)
    } catch {
      return '0'
    }
  }, [shahBalanceData])

  const fetchBalances = async (walletAddress: string) => {
    try {
      const [ethPriceResponse, shahPriceUsd] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
          .then((res) => res.json())
          .catch(() => ({ ethereum: { usd: 0 } })),
        getShahPriceUsd(),
      ])

      const ethUsdPrice = ethPriceResponse?.ethereum?.usd ?? 0

      setEthPrice(ethUsdPrice)
      setShahPrice(shahPriceUsd)

      const balances = [
        {
          symbol: 'ETH',
          balance: formattedEthBalance,
          usdValue: parseFloat(formattedEthBalance) * ethUsdPrice,
        },
        shahTokenAddress
          ? {
              symbol: 'SHAH',
              balance: formattedShahBalance,
              usdValue: parseFloat(formattedShahBalance) * shahPriceUsd,
              address: shahTokenAddress,
            }
          : null,
      ].filter((token): token is { symbol: string; balance: string; usdValue: number; address?: string } => !!token)

      setTokenBalances(balances)
      setTotalUSD(balances.reduce((acc, token) => acc + token.usdValue, 0))

      if (balances.length > 0) {
        const tokenSummary = balances
          .map((token) => `${token.symbol} (${parseFloat(token.balance).toFixed(4)})`)
          .join(', ')

        const tipPrompt = `My wallet tokens are: ${tokenSummary}. Suggest a useful crypto wallet tip.`
        const tip = await getAiTip(tipPrompt)
        setAiTip(tip)
        setTipHistory((prev) => [tip, ...prev])
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, formattedEthBalance, formattedShahBalance])

  useEffect(() => {
    const loadDiscoveryData = async () => {
      if (!process.env.NEXT_PUBLIC_ENABLE_DISCOVERY || process.env.NEXT_PUBLIC_ENABLE_DISCOVERY !== 'true') {
        return
      }

      try {
        const discoveryData: any[] = []
        setDiscoveryTokens(discoveryData)
      } catch (error) {
        console.error('Error loading discovery data:', error)
      }
    }

    loadDiscoveryData()
  }, [])

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="card card-glass text-center py-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
            <Wallet className="h-10 w-10" style={{ color: '#D4AF37' }} />
          </div>
          <h2 className="text-2xl font-semibold" style={{ color: '#F1F1F1' }}>Connect Your Wallet</h2>
          <p className="mb-8 mt-2 text-sm" style={{ color: '#A1A1AA' }}>
            Connect your wallet to view your portfolio and start trading.
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#F1F1F1' }}>Dashboard</h1>
          <p className="mt-2 text-sm" style={{ color: '#A1A1AA' }}>
            Welcome back to your SHAH Wallet
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
          <div className="rounded-lg px-4 py-2 text-xs font-medium" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            Ethereum Mainnet
          </div>
          {address && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs md:text-sm" style={{ background: '#111111', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <Wallet className="h-4 w-4" style={{ color: '#D4AF37' }} />
              <span style={{ color: '#F1F1F1' }}>{formatAddress(address)}</span>
              <button aria-label="Copy address" onClick={() => navigator.clipboard.writeText(address)} className="transition-opacity hover:opacity-70">
                <Copy className="h-4 w-4" style={{ color: '#A1A1AA' }} />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'rgba(17, 17, 17, 0.6)', border: '1px solid rgba(212, 175, 55, 0.1)', backdropFilter: 'blur(20px)' }}>
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="text-xs uppercase tracking-wide" style={{ color: '#A1A1AA' }}>ETH Balance</div>
            <div className="mt-2 text-3xl font-semibold" style={{ color: '#F1F1F1' }}>{Number(formattedEthBalance).toFixed(4)}</div>
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#3B82F6' }}>
              <TrendingUp className="h-4 w-4" />
              <span>${(parseFloat(formattedEthBalance || '0') * ethPrice).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'rgba(17, 17, 17, 0.6)', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)', backdropFilter: 'blur(20px)' }}>
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }} />
          <div className="absolute right-4 top-4 h-12 w-12 opacity-10">
            <Image src="/shah-blue-logo.png" alt="SHAH" width={48} height={48} className="object-contain" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide" style={{ color: '#A1A1AA' }}>
              <Image src="/shah-blue-logo.png" alt="SHAH" width={18} height={18} />
              SHAH Token
            </div>
            <div className="mt-2 text-3xl font-semibold" style={{ color: '#3B82F6' }}>{Number(formattedShahBalance).toFixed(2)}</div>
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#10B981' }}>
              <ArrowUpRight className="h-4 w-4" />
              <span>${(parseFloat(formattedShahBalance || '0') * shahPrice).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'rgba(17, 17, 17, 0.6)', border: '1px solid rgba(212, 175, 55, 0.1)', backdropFilter: 'blur(20px)' }}>
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="text-xs uppercase tracking-wide" style={{ color: '#A1A1AA' }}>Total Portfolio</div>
            <div className="mt-2 text-3xl font-semibold" style={{ color: '#F1F1F1' }}>${totalUSD.toFixed(2)}</div>
            <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: '#10B981' }}>
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.2% (24h)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/swap" className="btn-gold h-12 text-center text-sm md:h-14 md:text-base">
          Swap
        </Link>
        <Link href="/staking" className="btn-outline h-12 text-center text-sm md:h-14 md:text-base">
          Stake
        </Link>
        <Link href="/farming" className="btn-outline h-12 text-center text-sm md:h-14 md:text-base">
          Farm
        </Link>
        <button onClick={handlePurchase} className="btn-outline h-12 text-sm md:h-14 md:text-base">
          Buy Crypto
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card card-glass">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>SHAH Price</h3>
              <p className="text-2xl font-semibold" style={{ color: '#D4AF37' }}>$1.72</p>
            </div>
            <div className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              +18.2%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
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

        <div className="card card-glass">
          <h3 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>Recent Activity</h3>
          <p className="mt-1 text-xs" style={{ color: '#A1A1AA' }}>Latest activity from Etherscan</p>
          <div className="mt-4">
            <TxHistory limit={4} />
          </div>
        </div>
      </section>

      {amountStaked && parseFloat(amountStaked.toString()) > 0 && (
        <motion.section layout className="card card-glass border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.08)]">
          <h2 className="text-lg font-semibold" style={{ color: '#D4AF37' }}>Staking Overview</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase" style={{ color: '#A1A1AA' }}>Staked SHAH</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: '#F1F1F1' }}>{amountStaked?.toString() || '0'}</p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: '#A1A1AA' }}>Tier</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: '#D4AF37' }}>
                {tier === 1 ? 'Bronze (10%)' : tier === 2 ? 'Silver (15%)' : tier === 3 ? 'Gold (20%)' : 'None'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: '#A1A1AA' }}>NFT Boost</p>
              <p className="mt-2 text-xl font-semibold" style={{ color: hasNftBoost ? '#10B981' : '#EF4444' }}>
                {hasNftBoost ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </motion.section>
      )}

      {tokenBalances.length > 0 && (
        <motion.section layout className="card card-glass">
          <h2 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>Token Balances</h2>
          <div className="mt-4 space-y-3">
            {tokenBalances.map((token) => (
              <div key={token.symbol} className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <div className="flex items-center gap-3">
                  {token.logoURI && <img src={token.logoURI} alt={token.symbol} className="h-8 w-8 rounded-full" />}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#F1F1F1' }}>
                      {token.symbol}
                      {token.address && <VerifiedBadge tokenAddress={token.address} className="ml-1" />}
                    </div>
                    <p className="text-xs" style={{ color: '#A1A1AA' }}>{token.balance}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ color: '#F1F1F1' }}>${(token.usdValue || 0).toFixed(2)}</p>
                  {token.address && !token.isVerified && (
                    <Link href="/factory/verify" className="text-xs transition-opacity hover:opacity-80" style={{ color: '#3B82F6' }}>
                      Request verification
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {process.env.NEXT_PUBLIC_ENABLE_DISCOVERY === 'true' && discoveryTokens.length > 0 && (
        <motion.section layout className="card card-glass border-[rgba(138,43,226,0.2)] bg-[rgba(138,43,226,0.1)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>Token Discovery</h2>
            <Link href="/discover" className="text-xs uppercase tracking-wide" style={{ color: '#A78BFA' }}>
              See all →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
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
                className="bg-transparent"
              />
            ))}
          </div>
        </motion.section>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {aiTip && (
          <motion.div layout className="card card-glass">
            <h2 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>🤖 AI Wallet Tip</h2>
            <p className="mt-3 text-sm" style={{ color: '#A1A1AA' }}>{aiTip}</p>
          </motion.div>
        )}

        <motion.div layout className="card card-glass">
          <h2 className="text-lg font-semibold" style={{ color: '#F1F1F1' }}>Supabase Integration Test</h2>
          <div className="mt-3 text-sm" style={{ color: '#A1A1AA' }}>
            <SupabaseTest />
          </div>
        </motion.div>
      </section>
    </div>
  )
}
