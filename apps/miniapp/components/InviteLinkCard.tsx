'use client'

import { useState, useEffect } from 'react'
import { Copy, Share2, Users, TrendingUp, Gift } from 'lucide-react'
import { getTelegramWebApp, triggerHapticFeedback } from '@/lib/telegram'

interface ReferralStats {
  total_invites: number
  joined: number
  first_swap: number
  first_stake: number
  invoice_paid: number
}

interface InviteLinkCardProps {
  walletAddress: string
  initData: string
}

export default function InviteLinkCard({ walletAddress, initData }: InviteLinkCardProps) {
  const [referralUrl, setReferralUrl] = useState('')
  const [refCode, setRefCode] = useState('')
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    createReferralLink()
  }, [walletAddress, initData])

  const createReferralLink = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/referrals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          inviterWallet: walletAddress
        })
      })

      const data = await response.json()

      if (data.success) {
        setReferralUrl(data.referralUrl)
        setRefCode(data.refCode)
        // Mock stats for now - in real implementation, fetch from API
        setStats({
          total_invites: 12,
          joined: 8,
          first_swap: 5,
          first_stake: 3,
          invoice_paid: 2
        })
      } else {
        setError(data.error || 'Failed to create referral link')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error creating referral link:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      triggerHapticFeedback('light')
      
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareToChat = () => {
    const telegram = getTelegramWebApp()
    if (telegram?.showPopup) {
      telegram.showPopup({
        title: 'Share Referral Link',
        message: `Join SHAH Wallet using my referral link and earn rewards!\n\n${referralUrl}`,
        buttons: [
          { type: 'default', text: 'Share' },
          { type: 'cancel', text: 'Cancel' }
        ]
      })
    } else {
      // Fallback to copy
      copyToClipboard()
    }
    triggerHapticFeedback('light')
  }

  if (loading) {
    return (
      <div className="mini-card animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mini-card border-red-200 bg-red-50">
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={createReferralLink}
          className="mt-2 text-xs text-red-600 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="mini-card">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold text-gray-800">Invite & Earn</h3>
      </div>

      {/* Referral Link */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-xs text-gray-600 mb-2">Your Referral Link</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm font-mono text-gray-800 truncate">
            {referralUrl}
          </div>
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-blue-600'}`} />
          </button>
          <button
            onClick={shareToChat}
            className="p-1.5 rounded-md bg-green-100 hover:bg-green-200 transition-colors"
          >
            <Share2 className="w-4 h-4 text-green-600" />
          </button>
        </div>
        {copied && (
          <div className="text-xs text-green-600 mt-1">Copied!</div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.total_invites}</div>
            <div className="text-xs text-gray-600">Total Invites</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.joined}</div>
            <div className="text-xs text-gray-600">Joined</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{stats.first_swap}</div>
            <div className="text-xs text-gray-600">First Swap</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{stats.first_stake}</div>
            <div className="text-xs text-gray-600">First Stake</div>
          </div>
        </div>
      )}

      {/* Rewards Info */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <div className="text-sm font-semibold text-gray-800">Earn Rewards</div>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• 5% bonus on first swap</div>
          <div>• 10% bonus on first stake</div>
          <div>• 2% commission on invoices</div>
        </div>
      </div>
    </div>
  )
} 