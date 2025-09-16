// ✅ page.tsx (with transaction history, AI tips, export, filters)
'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchErc20Balances, fetchEthBalance } from '@/utils/fetchTokenBalances'
import { fetchTokenPrices } from '@/utils/fetchPrices'
import TokenComboChart from '@/components/TokenComboChart'
import AvaTipBox from '@/components/AvaTipBox'
import ExportButton from '@/components/ExportButton'
import TransactionHistory from '@/components/TransactionHistory'
import SortFilter from '@/components/SortFilter'

export type TokenBalance = {
  symbol: string
  name: string
  balance: string
  address: string
  logoURI?: string
  usdValue?: number
}

export default function HomePage() {
  const { address, isConnected } = useAccount()
  const [ethBalance, setEthBalance] = useState<string>('0.0000')
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'usd' | 'symbol'>('usd')

  const fetchBalances = async (walletAddress: string) => {
    try {
      setIsLoading(true)
      const eth = await fetchEthBalance(walletAddress)
      const erc20 = await fetchErc20Balances(walletAddress)
      const contractAddresses = erc20.map((token) => token.address)
      const prices = await fetchTokenPrices(contractAddresses)
      const tokensWithUsd = erc20.map((token) => ({
        ...token,
        usdValue: prices[token.address.toLowerCase()] ?? 0,
      }))
      setEthBalance(eth)
      setTokenBalances(tokensWithUsd)
    } catch (err) {
      console.error('Failed to fetch balances:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances(address)
    }
  }, [address, isConnected])

  const sortedBalances = [...tokenBalances].sort((a, b) => {
    if (sortBy === 'usd') return (b.usdValue ?? 0) - (a.usdValue ?? 0)
    return a.symbol.localeCompare(b.symbol)
  })

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6">SHAH Wallet Dashboard</h1>

      {isConnected ? (
        <>
          <div className="bg-gray-800 p-4 rounded mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">ETH Balance</h2>
              <button
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => fetchBalances(address!)}
              >
                🔄 Refresh
              </button>
            </div>
            <p>{ethBalance} ETH</p>
          </div>

          <div className="bg-gray-800 p-4 rounded mb-4">
            <h2 className="text-xl font-semibold mb-2">Total Wallet Value</h2>
            <p className="text-green-400 text-2xl font-bold animate-pulse">
              ${tokenBalances.reduce((sum, t) => sum + (t.usdValue ?? 0), 0).toFixed(2)}
            </p>
          </div>

          <SortFilter sortBy={sortBy} setSortBy={setSortBy} />

          <div className="bg-gray-800 p-4 rounded mb-6">
            <h2 className="text-xl font-semibold mb-2">Token Balances</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse flex justify-between py-2 border-b border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-700 rounded-full" />
                      <div className="w-24 h-4 bg-gray-700 rounded" />
                    </div>
                    <div className="w-20 h-4 bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              sortedBalances.map((token) => (
                <div
                  key={token.symbol}
                  className="flex items-center justify-between border-b border-gray-700 py-2"
                >
                  <div className="flex items-center gap-2">
                    {token.logoURI && (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{token.symbol}</span>
                  </div>
                  <span className="text-right sm:text-left">
                    {token.balance} {token.symbol}
                    <br className="block sm:hidden" />
                    ${token.usdValue?.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="overflow-x-auto mb-6">
            <TokenComboChart data={tokenBalances} />
          </div>

          <TransactionHistory address={address!} />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <ExportButton balances={tokenBalances} eth={ethBalance} />
            <AvaTipBox balances={tokenBalances} />
          </div>
        </>
      ) : (
        <p className="text-gray-400">Please connect your wallet to see balances.</p>
      )}
    </main>
  )
}
