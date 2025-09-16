'use client'

import { useAccount, useBalance } from 'wagmi'
import { formatEther } from 'viem'

const SHAH_CONTRACT = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8'

export default function WalletInfo() {
  const { address, isConnected } = useAccount()

  const { data: balanceData } = useBalance({
    address,
    token: SHAH_CONTRACT as `0x${string}`,
    watch: true,
  })

  if (!isConnected) return null

  return (
    <div className="text-sm text-right p-4 bg-gray-100 rounded-xl shadow-md">
      <div><strong>Wallet:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}</div>
      <div><strong>SHAH:</strong> {balanceData ? parseFloat(formatEther(balanceData.value)).toFixed(2) : '0'} SHA</div>
    </div>
  )
}

