'use client'

import { useEffect, useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useAccount } from 'wagmi'
// import { fetchErc20Balances, fetchEthBalance } from '@/utils/fetchTokenBalances'
import { getAiTip } from '@/utils/aiTip'
import TokenBarChart from '@/components/TokenBarChart'
import VerifiedBadge from '@/components/VerifiedBadge'
import ChartEmbed from '@/components/ChartEmbed'
import TxHistory from '@/components/TxHistory'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { useStakingInfo } from '@/hooks/useStakingInfo'
import Link from 'next/link'
import TokenRow from '@/components/TokenRow'
// import { getNewTokens, getVerifiedTokens } from '@/lib/discovery'
import SupabaseTest from '@/components/SupabaseTest'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
      // const eth = await fetchEthBalance(walletAddress)
      // const tokens = await fetchErc20Balances(walletAddress)
      const eth = 0 // Placeholder
      const tokens = [] // Placeholder

      setEthBalance(eth)
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
        const SHAH_FACTORY = process.env.NEXT_PUBLIC_SHAH_FACTORY || '0x8B33FD5A84ACb5dAf1A5ce046F65A506eB05288a'
        const SHAH_REGISTRY = process.env.NEXT_PUBLIC_SHAH_REGISTRY || '0x26027A7cbe7BF2DD5DA9b0B7Cb0F1dd4b998d11f'

        // Get top 3 tokens from each category
        const [newTokens, verifiedResult] = await Promise.all([
          // getNewTokens(SHAH_FACTORY).then(tokens => tokens.slice(0, 1)),
          // getVerifiedTokens(SHAH_REGISTRY, 1, 1)
          Promise.resolve([]), // Placeholder
          Promise.resolve([]) // Placeholder
        ])

        const discoveryData = [
          ...newTokens.map(token => ({ ...token, type: 'new' })),
          ...verifiedResult.tokens.map(token => ({ ...token, type: 'verified' }))
        ]

        setDiscoveryTokens(discoveryData)
      } catch (error) {
        console.error('Error loading discovery data:', error)
      }
    }

    loadDiscoveryData()
  }, [])

  return (
    <main className="p-4 max-w-2xl mx-auto text-white animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-center">SHAH Wallet Dashboard</h1>

      {/* 🔁 Fancy Navigation Button to Staking Page */}
      <div className="mb-6 flex justify-center gap-4">
  <Link href="/staking">
    <button className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200">
      🚀 Go to Staking
    </button>
  </Link>
  <Link href="/swap">
    <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all duration-200">
      🔄 Go to Swap
    </button>
  </Link>
</div>

      {isConnected ? (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div layout className="bg-gray-900 p-4 rounded mb-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-1">ETH Balance</h2>
            <p>{ethBalance} ETH</p>
          </motion.div>

          {/* SHAH Trading Chart */}
          <motion.div layout className="mb-4">
            <ChartEmbed 
              pair="ETH-SHAH"
              height={350}
              className="w-full"
            />
          </motion.div>

          <motion.div layout className="bg-yellow-900 p-4 rounded mb-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-1">📈 Staking Tier & NFT Boost</h2>
            <p className="mb-1 text-sm">
              Your SHA Balance: <span className="font-bold text-white">{amountStaked?.toString() || '0'}</span>
            </p>
            <p className="mb-1 text-sm">
              SHAH GOLD NFT Owned: <span className={`font-bold ${hasNftBoost ? 'text-green-300' : 'text-red-400'}`}>{hasNftBoost ? '✅ Yes' : '❌ No'}</span>
            </p>
            <div className="mt-2 text-sm">
              <p>
                🎯 <span className="font-semibold">Your Staking Tier:</span>{' '}
                {tier === 1
                  ? 'Tier 1 — 10% APY'
                  : tier === 2
                  ? 'Tier 2 — 15% APY'
                  : tier === 3
                  ? 'Tier 3 — 20% APY'
                  : '—'}
              </p>
              <p>
                💎 <span className="font-semibold">NFT Boost:</span>{' '}
                {hasNftBoost ? '+Extra rewards (enabled)' : '—'}
              </p>
            </div>
            <div className="mt-3 text-xs text-gray-200">
              <p className="mb-1">• Tier 1: 100–999 SHA → 10% APY</p>
              <p className="mb-1">• Tier 2: 1,000–4,999 SHA → 15% APY</p>
              <p>• Tier 3: ≥ 5,000 SHA → 20% APY</p>
            </div>
          </motion.div>

          <motion.div layout className="bg-gray-900 p-4 rounded mb-4 shadow-xl">
            <h2 className="text-xl font-semibold mb-2">Token Balances</h2>
            {tokenBalances.map((token) => (
              <motion.div
                layout
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                key={token.symbol}
                className="flex items-center justify-between border-b border-gray-700 py-2"
              >
                <div className="flex items-center gap-2">
                  {token.logoURI && (
                    <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
                  )}
                  <span>{token.symbol}</span>
                  {token.address && (
                    <VerifiedBadge tokenAddress={token.address} className="ml-1" />
                  )}
                </div>
                <div className="text-right">
                  <p>{token.balance}</p>
                  <p className="text-sm text-gray-400">${(token.usdValue || 0).toFixed(2)}</p>
                  {token.address && !token.isVerified && (
                    <Link 
                      href="/factory/verify" 
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      Request verification
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div layout className="bg-indigo-900 p-4 rounded mb-4 shadow-lg">
            <h2 className="text-lg font-semibold">💰 Total Wallet Value</h2>
            <p className="text-xl font-bold">${totalUSD.toFixed(2)} USD</p>
          </motion.div>

          <motion.div layout className="bg-gray-900 p-4 rounded mb-6 shadow-md">
            <h2 className="text-lg font-semibold mb-2">📊 Wallet Overview Chart</h2>
            <TokenBarChart data={tokenBalances} />
          </motion.div>

          {/* Discovery Card */}
          {process.env.NEXT_PUBLIC_ENABLE_DISCOVERY === 'true' && (
            <motion.div layout className="bg-purple-900/30 backdrop-blur-sm border border-purple-500/30 p-4 rounded-xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">🔍 Token Discovery</h2>
                <Link href="/discover" className="text-purple-400 hover:text-purple-300 text-sm">
                  See all →
                </Link>
              </div>
              
              {discoveryTokens.length > 0 ? (
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
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">Loading discovery data...</p>
                </div>
              )}
            </motion.div>
          )}

          <motion.div layout className="bg-gray-800 p-4 rounded mt-6">
            <h2 className="text-lg font-semibold mb-2">🤖 AI Wallet Tip</h2>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiTip}</p>
          </motion.div>

          <motion.div layout className="bg-gray-800 p-4 rounded mt-4">
            <h2 className="text-sm font-semibold mb-1">📜 Previous Tips</h2>
            <ul className="text-xs text-gray-400 list-disc pl-4">
              {tipHistory.slice(1, 4).map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </motion.div>

          {tradeLog.length > 0 && (
            <motion.div layout className="bg-green-900 p-4 rounded mt-4">
              <h2 className="text-sm font-semibold mb-1">🤖 Bot Trade Ideas</h2>
              <ul className="text-xs text-green-300 list-disc pl-4">
                {tradeLog.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.form layout onSubmit={handleEmailSubmit} className="bg-gray-900 p-4 rounded mt-6">
            <label className="block text-sm font-medium mb-1">💌 Send AI Tip to Email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded text-black"
                required
              />
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
                Send
              </button>
            </div>
          </motion.form>

          <motion.div layout className="bg-gray-900 p-4 rounded mt-4 text-center">
            <h2 className="text-sm font-medium mb-2">🛒 Purchase SHAH Token</h2>
            <button onClick={handlePurchase} className="bg-green-600 text-white px-4 py-2 rounded">
              Buy SHAH Token
            </button>
          </motion.div>

          <motion.div layout className="bg-yellow-800 p-4 rounded mt-4 text-center">
            <h2 className="text-sm font-medium mb-2">🤖 Enable Auto Trade Bot</h2>
            <button
              onClick={() => {
                setBotActive((prev) => {
                  const next = !prev
                  setBotStatus(next ? 'Bot is running...' : 'Bot is off')
                  return next
                })
              }}
              className="bg-yellow-500 text-black px-4 py-2 rounded"
            >
              {botActive ? '🛑 Stop Bot' : '🚀 Start Bot'}
            </button>
            <p className="text-xs mt-2 text-gray-200">{botStatus}</p>
          </motion.div>

          {/* Transaction History Widget */}
          <motion.div layout className="mt-4">
            <TxHistory limit={8} />
          </motion.div>

          {/* Supabase Integration Test */}
          <motion.div layout className="mt-6">
            <SupabaseTest />
          </motion.div>
        </motion.div>
      ) : (
        <p className="text-gray-400 text-center">Please connect your wallet to see balances.</p>
      )}
    </main>
  )
}
