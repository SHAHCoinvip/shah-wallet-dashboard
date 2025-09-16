'use client'

import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/factory'
import { VerifiedTokenRegistryABI } from '@/abi/VerifiedTokenRegistry'

interface VerifiedBadgeProps {
  tokenAddress: string
  className?: string
}

export default function VerifiedBadge({ tokenAddress, className = '' }: VerifiedBadgeProps) {
  const { data: isVerified, isLoading } = useReadContract({
    address: CONTRACTS.SHAH_REGISTRY,
    abi: VerifiedTokenRegistryABI,
    functionName: 'isVerified',
    args: [tokenAddress as `0x${string}`],
    query: { enabled: !!tokenAddress && /^0x[a-fA-F0-9]{40}$/.test(tokenAddress) }
  })

  if (isLoading) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-400 text-xs">Checking...</span>
      </div>
    )
  }

  if (!isVerified) return null

  return (
    <div 
      className={`inline-flex items-center space-x-1 bg-green-600/20 border border-green-500/30 rounded-full px-2 py-1 ${className}`}
      title="Verified by SHAH - This token has been reviewed and approved"
    >
      <span className="text-green-400 text-xs">✅</span>
      <span className="text-green-400 text-xs font-medium">Verified</span>
    </div>
  )
}