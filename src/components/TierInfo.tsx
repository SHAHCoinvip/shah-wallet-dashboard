'use client'

import { useEffect, useState } from 'react'

const TierInfo = () => {
  const [balance, setBalance] = useState<number>(0)
  const [nftOwned, setNftOwned] = useState<boolean>(false)
  const [tier, setTier] = useState<string>('N/A')
  const [apy, setApy] = useState<number>(0)

  // Simulate fetching data (replace with real Web3 calls later)
  useEffect(() => {
    // Simulated wallet data
    const simulatedBalance = 1200 // replace with real SHAH balance
    const ownsNft = true // replace with real NFT check

    setBalance(simulatedBalance)
    setNftOwned(ownsNft)

    if (simulatedBalance >= 5000) {
      setTier('Tier 3')
      setApy(20)
    } else if (simulatedBalance >= 1000) {
      setTier('Tier 2')
      setApy(15)
    } else if (simulatedBalance >= 100) {
      setTier('Tier 1')
      setApy(10)
    } else {
      setTier('None')
      setApy(0)
    }

    if (ownsNft) {
      setApy(prev => prev + 5) // NFT boost +5%
    }
  }, [])

  return (
    <div className="p-4 border rounded-xl shadow-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-full max-w-md mx-auto mt-6">
      <h2 className="text-xl font-bold mb-2">⛏️ Staking Tier Info</h2>
      <p className="mb-1">💰 Your Balance: <strong>{balance} SHAH</strong></p>
      <p className="mb-1">🎖️ Tier: <strong>{tier}</strong></p>
      <p className="mb-1">🏆 SHAH GOLD NFT: <strong>{nftOwned ? 'Yes' : 'No'}</strong></p>
      <p className="mb-1">📈 Reward APY: <strong>{apy}%</strong></p>
    </div>
  )
}

export default TierInfo

