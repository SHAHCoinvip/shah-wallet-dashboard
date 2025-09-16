'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { initializeTelegramWebApp } from '@/lib/telegram'
import InviteLinkCard from '@/components/InviteLinkCard'
import { Trophy, Users, TrendingUp, RefreshCw } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  username: string
  totalInvites: number
  totalEarnings: number
}

export default function ReferralsPage() {
  const { address } = useAccount()
  const [initData, setInitData] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeTelegramWebApp()
    // Get initData from URL or Telegram WebApp
    const urlParams = new URLSearchParams(window.location.search)
    const tgInitData = urlParams.get('tgWebAppData') || ''
    setInitData(tgInitData)
    
    // Load mock leaderboard data
    loadLeaderboard()
  }, [])

  const loadLeaderboard = () => {
    // Mock leaderboard data
    const mockLeaderboard: LeaderboardEntry[] = [
      { rank: 1, username: '@crypto_king', totalInvites: 156, totalEarnings: 2340 },
      { rank: 2, username: '@shah_whale', totalInvites: 89, totalEarnings: 1567 },
      { rank: 3, username: '@defi_master', totalInvites: 67, totalEarnings: 1234 },
      { rank: 4, username: '@web3_builder', totalInvites: 45, totalEarnings: 890 },
      { rank: 5, username: '@token_hunter', totalInvites: 34, totalEarnings: 567 }
    ]
    setLeaderboard(mockLeaderboard)
    setLoading(false)
  }

  if (!address) {
    return (
      <div className="mini-app-container">
        <div className="mini-card">
          <div className="text-center text-gray-500">
            Please connect your wallet to view referrals
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mini-app-container">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Referrals</h1>
        <p className="text-sm text-gray-600">
          Invite friends and earn rewards on their activities
        </p>
      </div>

      {/* Invite Link Card */}
      <div className="mb-6">
        <InviteLinkCard walletAddress={address} initData={initData} />
      </div>

      {/* Leaderboard */}
      <div className="mini-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Top Referrers</h3>
          </div>
          <button
            onClick={loadLeaderboard}
            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                    entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'}
                `}>
                  {entry.rank}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{entry.username}</div>
                  <div className="text-xs text-gray-500">
                    {entry.totalInvites} invites
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${entry.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">earned</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="mini-card mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">How It Works</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <div className="font-medium text-gray-800">Share Your Link</div>
              <div className="text-sm text-gray-600">
                Copy and share your unique referral link with friends
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <div className="font-medium text-gray-800">Friends Join</div>
              <div className="text-sm text-gray-600">
                When they join using your link, you both get rewards
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <div className="font-medium text-gray-800">Earn Together</div>
              <div className="text-sm text-gray-600">
                Earn commissions on their swaps, stakes, and invoices
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Breakdown */}
      <div className="mini-card mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">Rewards Breakdown</h3>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700">First Swap</span>
            </div>
            <span className="font-semibold text-blue-600">5% bonus</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">First Stake</span>
            </div>
            <span className="font-semibold text-green-600">10% bonus</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-700">Invoice Payment</span>
            </div>
            <span className="font-semibold text-purple-600">2% commission</span>
          </div>
        </div>
      </div>
    </div>
  )
} 