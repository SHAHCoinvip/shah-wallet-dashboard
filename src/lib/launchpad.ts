import { readContract } from '@wagmi/core'
import { formatUnits, parseUnits } from 'viem'
import { wagmiConfig } from '@/utils/wagmiConfig'
import { ERC20ABI } from '@/abi/ERC20'
import { SHAHPriceOracleABI } from '@/abi/SHAHPriceOracle'
import { formatShahPrice, calcShahForUsd } from './factory'

export interface LaunchpadDrop {
  id: string
  title: string
  description: string
  imageUrl: string
  bannerUrl?: string
  type: 'nft' | 'token'
  status: 'upcoming' | 'live' | 'ended' | 'sold_out'
  
  // Timing
  startAt: string // ISO string
  endAt: string // ISO string
  
  // Pricing
  priceUSD: number
  priceShah?: string // Will be calculated from USD price
  maxSupply: number
  currentSupply: number
  maxPerWallet: number
  
  // Contract details
  contractAddress: string
  tokenId?: number // For NFTs
  chainId: number
  
  // Partner info
  partner: {
    name: string
    logo: string
    website: string
    twitter?: string
    discord?: string
  }
  
  // Features
  features: string[]
  roadmap?: string[]
  
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface LaunchpadStats {
  totalDrops: number
  liveDrops: number
  totalRaised: number
  totalParticipants: number
}

// Mock data for demonstration
const MOCK_DROPS: LaunchpadDrop[] = [
  {
    id: 'cosmic-nft-genesis',
    title: 'Cosmic Warriors Genesis',
    description: 'Premium NFT collection featuring 10,000 unique cosmic warriors with special abilities and exclusive access to the Cosmic metaverse.',
    imageUrl: '/api/placeholder/400/400',
    bannerUrl: '/api/placeholder/800/400',
    type: 'nft',
    status: 'live',
    startAt: new Date(Date.now() - 86400000).toISOString(), // Started 1 day ago
    endAt: new Date(Date.now() + 86400000 * 6).toISOString(), // Ends in 6 days
    priceUSD: 0.1,
    maxSupply: 10000,
    currentSupply: 3247,
    maxPerWallet: 10,
    contractAddress: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    partner: {
      name: 'Cosmic Studios',
      logo: '/api/placeholder/64/64',
      website: 'https://cosmic.example',
      twitter: 'https://twitter.com/cosmicstudios',
      discord: 'https://discord.gg/cosmic'
    },
    features: [
      '🎮 Play-to-Earn Gaming',
      '🏆 Exclusive Tournaments', 
      '🎨 Unique Art by Top Artists',
      '🌟 Metaverse Land Access'
    ],
    roadmap: [
      'Q1 2024: NFT Launch & Marketplace',
      'Q2 2024: Metaverse Beta Launch',
      'Q3 2024: Mobile Game Release',
      'Q4 2024: DAO Governance Launch'
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'defi-token-launch',
    title: 'DeFiMax Token ($DFMAX)',
    description: 'Revolutionary DeFi token with automated yield farming, cross-chain bridging, and governance features.',
    imageUrl: '/api/placeholder/400/400',
    bannerUrl: '/api/placeholder/800/400',
    type: 'token',
    status: 'upcoming',
    startAt: new Date(Date.now() + 86400000 * 3).toISOString(), // Starts in 3 days
    endAt: new Date(Date.now() + 86400000 * 10).toISOString(), // Ends in 10 days
    priceUSD: 0.05,
    maxSupply: 1000000,
    currentSupply: 0,
    maxPerWallet: 10000,
    contractAddress: '0x2345678901234567890123456789012345678901',
    chainId: 1,
    partner: {
      name: 'DeFiMax Protocol',
      logo: '/api/placeholder/64/64',
      website: 'https://defimax.example',
      twitter: 'https://twitter.com/defimax'
    },
    features: [
      '💰 Auto-Yield Farming',
      '🌉 Cross-Chain Bridge',
      '🗳️ DAO Governance',
      '🔒 Audited Smart Contracts'
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pixel-punks-collection',
    title: 'Pixel Punks Deluxe',
    description: 'Retro-style pixel art NFT collection with 8,888 unique punks, each with rare traits and utility.',
    imageUrl: '/api/placeholder/400/400',
    type: 'nft',
    status: 'ended',
    startAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    endAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    priceUSD: 0.08,
    maxSupply: 8888,
    currentSupply: 8888,
    maxPerWallet: 5,
    contractAddress: '0x3456789012345678901234567890123456789012',
    chainId: 1,
    partner: {
      name: 'Pixel Studios',
      logo: '/api/placeholder/64/64',
      website: 'https://pixel.example'
    },
    features: [
      '🎨 Hand-crafted Pixel Art',
      '🎲 Randomized Traits',
      '🎪 Community Events',
      '💎 Rare Collectibles'
    ],
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString()
  }
]

/**
 * Get all drops filtered by status
 */
export async function getDropsByStatus(status?: LaunchpadDrop['status']): Promise<LaunchpadDrop[]> {
  try {
    // In production, this would fetch from Supabase or an API
    let drops = [...MOCK_DROPS]
    
    if (status) {
      drops = drops.filter(drop => drop.status === status)
    }
    
    // Calculate SHAH prices for all drops
    const dropsWithShahPrices = await Promise.all(
      drops.map(async (drop) => {
        try {
          const shahPrice = await getShahPriceForDrop()
          const shahAmount = calcShahForUsd(drop.priceUSD, shahPrice)
          return {
            ...drop,
            priceShah: formatUnits(BigInt(shahAmount), 18)
          }
        } catch (error) {
          console.error('Error calculating SHAH price for drop:', error)
          return {
            ...drop,
            priceShah: '0'
          }
        }
      })
    )
    
    return dropsWithShahPrices
  } catch (error) {
    console.error('Error fetching drops:', error)
    return []
  }
}

/**
 * Get a single drop by ID
 */
export async function getDropById(id: string): Promise<LaunchpadDrop | null> {
  try {
    const drops = await getDropsByStatus()
    return drops.find(drop => drop.id === id) || null
  } catch (error) {
    console.error('Error fetching drop:', error)
    return null
  }
}

/**
 * Get launchpad statistics
 */
export async function getLaunchpadStats(): Promise<LaunchpadStats> {
  try {
    const drops = await getDropsByStatus()
    
    return {
      totalDrops: drops.length,
      liveDrops: drops.filter(d => d.status === 'live').length,
      totalRaised: drops.reduce((sum, drop) => sum + (drop.currentSupply * drop.priceUSD), 0),
      totalParticipants: 1247 // Mock data - would come from analytics
    }
  } catch (error) {
    console.error('Error fetching launchpad stats:', error)
    return {
      totalDrops: 0,
      liveDrops: 0,
      totalRaised: 0,
      totalParticipants: 0
    }
  }
}

/**
 * Get SHAH price for drops (reuse oracle logic)
 */
async function getShahPriceForDrop(): Promise<number> {
  try {
    const SHAH_PRICE_ORACLE = process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE as `0x${string}`
    
    const priceData = await readContract(wagmiConfig, {
      address: SHAH_PRICE_ORACLE,
      abi: SHAHPriceOracleABI,
      functionName: 'getPriceInUSD',
    })
    
    return formatShahPrice(priceData as bigint)
  } catch (error) {
    console.error('Error fetching SHAH price:', error)
    return 0.05 // Fallback price
  }
}

/**
 * Format time remaining until drop starts/ends
 */
export function getTimeRemaining(targetDate: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
} {
  const now = new Date().getTime()
  const target = new Date(targetDate).getTime()
  const difference = target - now
  
  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    }
  }
  
  const days = Math.floor(difference / (1000 * 60 * 60 * 24))
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((difference % (1000 * 60)) / 1000)
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false
  }
}

/**
 * Format drop status for display
 */
export function getDropStatusDisplay(drop: LaunchpadDrop): {
  text: string
  color: string
  icon: string
} {
  switch (drop.status) {
    case 'upcoming':
      return {
        text: 'Coming Soon',
        color: 'text-blue-400',
        icon: '🔜'
      }
    case 'live':
      return {
        text: 'Live Now',
        color: 'text-green-400',
        icon: '🔴'
      }
    case 'ended':
      return {
        text: 'Ended',
        color: 'text-gray-400',
        icon: '✅'
      }
    case 'sold_out':
      return {
        text: 'Sold Out',
        color: 'text-yellow-400',
        icon: '🔥'
      }
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-400',
        icon: '❓'
      }
  }
}

/**
 * Calculate drop progress percentage
 */
export function getDropProgress(drop: LaunchpadDrop): number {
  if (drop.maxSupply === 0) return 0
  return Math.min((drop.currentSupply / drop.maxSupply) * 100, 100)
}

/**
 * Mock function to purchase from a drop
 */
export async function purchaseFromDrop(
  dropId: string, 
  quantity: number, 
  paymentMethod: 'shah' | 'eth'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // In production, this would:
    // 1. Check user's balance
    // 2. Approve tokens if needed
    // 3. Call the drop contract
    // 4. Handle the transaction
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock success
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substring(2, 66)
    }
  } catch (error) {
    console.error('Purchase error:', error)
    return {
      success: false,
      error: 'Purchase failed. Please try again.'
    }
  }
}